package edu.illinois.tradersclub.loader.apps

import cats.effect.IO
import cats.implicits._
import com.monovore.decline.{CommandApp, Opts}
import doobie.implicits._
import doobie.util.log.{ExecFailure, LogHandler, ProcessingFailure, Success}
import edu.illinois.tradersclub.loader.config._
import edu.illinois.tradersclub.loader.db._
import edu.illinois.tradersclub.loader.db.sql._
import edu.illinois.tradersclub.loader.db.data.Quote
import edu.illinois.tradersclub.loader.ioutils._
import fs2.Stream
import fs2.concurrent.SignallingRef
import fs2.data.csv.rows

import java.nio.file.{Files, Path, Paths}
import java.util.logging.Logger
import java.util.stream.Collectors
import scala.concurrent.duration._
import scala.io.Source
import scala.jdk.CollectionConverters.ListHasAsScala

object QuotesLoader
    extends CommandApp(
      name = "load-quotes",
      header = "load stock quotes history for a specified stock exchange (i.e. NASDAQ, OTC, ASX, etc.)",
      main = {
        val stockExchangeSymbolOpt  =
          Opts.option[String]("stock-exchange", help = "Symbol of the target stock exchange (i.e. NYSE, NYSE MKT, NASDAQ)")

        val pathOpt  =
          Opts.option[String]("path", help = "Path to the quotes archive")

        val allowUpdatesOpt  =
          Opts.flag("allow-updates", help = "Updates existing DB records in case of a conflict")
            .orFalse

        (pathOpt.map(value => Paths.get(value)), allowUpdatesOpt, stockExchangeSymbolOpt)
          .mapN { (path, allowUpdates, stockExchangeSymbol) =>
            if (!Files.exists(path)) {
              Console.err.println(s"ERROR>>> Path ${path} does not exists!")
            } else if (!Files.isDirectory(path)) {
              Console.err.println(s"ERROR>>> Path ${path} is not a directory!")
            } else {
              val (transactor, maxConnections) = buildTransactor(databaseConfig)

              val parseLine = rows[IO](',')

              val maxParallelism = Runtime.getRuntime.availableProcessors() * 2

              val program = Stream.eval(transactor).flatMap { tx =>
                Stream.eval(SignallingRef[IO, Int](0)).flatMap { totalRecordsCount =>
                  Stream.eval(SignallingRef[IO, Int](0)).flatMap { totalRecordsProcessed =>
                    Stream.eval(IO(System.currentTimeMillis())).flatMap { startedAt =>
                      Stream.eval(IO(Files.list(path).collect(Collectors.toList[Path]).asScala))
                        .flatMap(values => Stream.emits[IO, Path](values))
                        .filter(path => !Files.isDirectory(path))
                        .evalMap { path =>
                          val fileName = path.getFileName.toString
                          fileName.split("\\.").headOption match {
                            case Some(stockName) =>
                              findStockIdBySymbol(stockName, stockExchangeSymbol).transact(tx).flatMap {
                                case Some(stockId) =>
                                  IO.pure(Some((stockId, path)))
                                case None =>
                                  IO(Console.err.println(s"ERROR>>> Unable to locate any matching stock record for the file: ${fileName}")) >>
                                    IO.pure(None)
                              }
                            case None =>
                              IO(Console.err.println(s"ERROR>>> Skipping file with unsupported name pattern: ${fileName}")) >>
                                IO.pure(None)
                          }
                        }
                        .collect { case Some((stockId, path)) => (stockId, path) }
                        .map { case (stockId, historyFilePath) =>
                          Stream.eval(IO(Console.out.println(s"[status] Processing file: ${historyFilePath.getFileName}")))
                            .flatMap { _ =>
                              for {
                                rowCounter <- Stream.eval(SignallingRef.apply(0))
                                file <- Stream.eval(IO(historyFilePath.toFile))
                                input <- Stream.eval(IO(Source.fromFile(file)))
                                lines <- Stream.eval(IO(input.getLines()))
                                columnsList <- Stream.emits(lines.mkString("\n"))
                                  .through(parseLine)
                                  .drop(1)
                                  .map(_.toList)
                                rowNum <- Stream.eval(rowCounter.updateAndGet(_ + 1))
                                quote <- Stream.emit(Quote(file.getName, stockId, columnsList)).evalMap {
                                  case None =>
                                    IO(Console.err.println(s"ERROR>>> ${historyFilePath.getFileName}: corrupt record at line ${rowNum}")) >>
                                      IO.pure(Option.empty[Quote])
                                  case Some(quote) =>
                                    IO.pure(Option[Quote](quote))
                                }
                              } yield quote
                            }
                            .collect {
                              case Some(quote) => quote
                            }
                            .evalTap { _ =>
                              totalRecordsCount.update(_ + 1)
                            }
                        }
                        .parJoin(maxParallelism)
                        .parEvalMapUnordered(maxConnections) { quote =>
                          updateOrInsertQuote(quote, allowUpdates).transact(tx) >> totalRecordsProcessed.updateAndGet(_ + 1)
                        }
                        .evalTap { recordsProcessed =>
                          if (recordsProcessed % 10000 == 0) {
                            totalRecordsCount.get.flatMap { recordsTotal =>
                              IO(Console.out.println(
                                s"[status] Records processed: inserted=${recordsProcessed}, parsed=${recordsTotal}"
                              ))
                            }
                          } else IO.unit
                        }
                        .onFinalize {
                          IO(
                            Console.out.println(s"[COMPLETE] Quotes loaded in ${(startedAt - System.currentTimeMillis()).millis.toSeconds} seconds")
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
