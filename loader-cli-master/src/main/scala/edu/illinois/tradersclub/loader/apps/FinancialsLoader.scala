package edu.illinois.tradersclub.loader.apps

import cats.effect.IO
import cats.implicits._
import com.monovore.decline.{CommandApp, Opts}
import io.circe.syntax._
import doobie.implicits._
import edu.illinois.tradersclub.loader.config._
import edu.illinois.tradersclub.loader.db._
import edu.illinois.tradersclub.loader.db.sql._
import edu.illinois.tradersclub.loader.db.data.{Financials, Quote}
import edu.illinois.tradersclub.loader.ioutils._
import fs2.Stream
import fs2.concurrent.SignallingRef
import fs2.data.csv.rows

import java.nio.file.{Files, Path, Paths}
import java.sql.Timestamp
import java.time.LocalDate
import java.util.logging.Logger
import java.util.stream.Collectors
import scala.concurrent.duration._
import scala.io.Source
import scala.jdk.CollectionConverters.ListHasAsScala

object FinancialsLoader
  extends CommandApp(
    name = "load-financials",
    header = "load stock financials history for a specified stock exchange (i.e. NASDAQ, OTC, ASX, etc.)",
    main = {
      val pathOpt  =
        Opts.option[String]("path", help = "Path to the quotes archive")

      val allowUpdatesOpt  =
        Opts.flag("allow-updates", help = "Updates existing DB records in case of a conflict")
          .orFalse

      (pathOpt.map(value => Paths.get(value)), allowUpdatesOpt)
        .mapN { (path, allowUpdates) =>
          if (!Files.exists(path)) {
            Console.err.println(s"ERROR>>> Path ${path} does not exists!")
          } else if (!Files.isDirectory(path)) {
            Console.err.println(s"ERROR>>> Path ${path} is not a directory!")
          } else {
            val (transactor, maxConnections) = buildTransactor(databaseConfig)

            val maxParallelism = Runtime.getRuntime.availableProcessors() * 2

            val program = Stream.eval(transactor).flatMap { tx =>
              Stream.eval(SignallingRef[IO, Int](0)).flatMap { totalRecordsCount =>
                Stream.eval(SignallingRef[IO, Int](0)).flatMap { totalRecordsProcessed =>
                  Stream.eval(IO(System.currentTimeMillis())).flatMap { startedAt =>
                    Stream.eval(IO(Files.list(path).collect(Collectors.toList[Path]).asScala))
                      .flatMap(values => Stream.emits[IO, Path](values))
                      .flatMap(file =>
                        Stream.eval(IO(Files.list(file).collect(Collectors.toList[Path]).asScala))
                          .flatMap(values => Stream.emits[IO, Path](values))
                      )
                      .filter(path => !Files.isDirectory(path))
                      .parEvalMapUnordered(maxParallelism) { path =>
                        val fileName = path.getFileName.toString
                        IO(Source.fromFile(path.toFile)).flatMap { sourceData =>
                          IO(io.circe.parser.parse(sourceData.mkString("")))
                            .map(decoded => (fileName, decoded))
                            .guarantee(IO(sourceData.close()))
                        }
                      }
                      .evalTap {
                        case (fileName, Right(decoded)) => IO.unit
                        case (fileName, Left(decoded)) =>
                          IO(Console.out.println(s"Decoding failure: ${fileName}, error: ${decoded.message}"))
                      }
                      .collect {
                        case (_, Right(decoded)) => decoded
                      }
                      .map { decoded =>
                        for {
                          symbol <- (decoded \\ "symbol").headOption.flatMap(_.asString)
                          startDate <- (decoded \\ "startDate").headOption.flatMap(_.asString)
                          endDate <- (decoded \\ "endDate").headOption.flatMap(_.asString)
                          year <- (decoded \\ "year").headOption.flatMap(_.asString.map(_.trim))
                          data <- (decoded \\ "data").headOption.map(_.asJson)
                        } yield {
                          Financials(
                            symbol,
                            Timestamp.valueOf(LocalDate.parse(startDate).atStartOfDay()),
                            Timestamp.valueOf(LocalDate.parse(endDate).atStartOfDay()),
                            year.toInt,
                            data
                          )
                        }
                      }
                      .collect { case Some(financials) => financials }
                      .evalTap { financials =>
                        totalRecordsCount.update(_ + 1)
                      }
                      .parEvalMapUnordered(maxConnections) { financials =>
                        findStockIdBySymbol(financials.symbol).transact(tx)
                          .map { stockId =>
                            (stockId, financials)
                          }
                      }
                      .collect {
                        case (Some(stockId), financials) =>
                          (stockId, financials)
                      }
                      .parEvalMapUnordered(maxConnections) { case (stockId, financials) =>
                        updateOrInsertFinancials(stockId, financials).transact(tx) >>
                          totalRecordsProcessed.updateAndGet(_ + 1)
                      }
                      .evalTap { recordsProcessed =>
                        if (recordsProcessed % 100 == 0) {
                          totalRecordsCount.get.flatMap { recordsTotal =>
                            IO(Console.out.println(
                              s"[status] Records processed: inserted=${recordsProcessed}, parsed=${recordsTotal}"
                            ))
                          }
                        } else IO.unit
                      }
                      .onFinalize {
                        IO(
                          Console.out.println(s"[COMPLETE] Financials loaded in ${(startedAt - System.currentTimeMillis()).millis.toSeconds} seconds")
                        )
                      }
                  }
                }
              }
            }

            program.compile.drain.unsafeRunSync
          }
        }
    }
  )
