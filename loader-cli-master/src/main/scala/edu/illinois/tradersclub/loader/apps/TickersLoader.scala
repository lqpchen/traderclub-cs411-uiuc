package edu.illinois.tradersclub.loader.apps

import cats.effect.IO
import com.monovore.decline.{ CommandApp, Opts }
import doobie.implicits._
import edu.illinois.tradersclub.loader.config._
import edu.illinois.tradersclub.loader.db._
import edu.illinois.tradersclub.loader.db.data.{ Company, Exchange, Ticker }
import edu.illinois.tradersclub.loader.db.sql._
import edu.illinois.tradersclub.loader.ioutils._
import fs2.Stream
import fs2.concurrent.SignallingRef
import fs2.data.csv.rows

import java.io.File
import scala.io.Source

object TickersLoader
    extends CommandApp(
      name = "load-tickers",
      header = "load tickers list",
      main = {
        val pathOpt =
          Opts.option[String]("path", help = "Path to the quotes archive")

        pathOpt.map {
          path =>
            val (transactor, maxConnections) = buildTransactor(databaseConfig)

            val parseLine = rows[IO]('|')

            val program =
              for {
                rowCounter  <- Stream.eval(SignallingRef.apply(0))
                input       <- Stream.eval(IO(Source.fromFile(new File(path))))
                tx          <- Stream.eval(transactor)
                columnsList <- Stream
                                 .emits(input.getLines().mkString("\n"))
                                 .through(parseLine)
                                 .drop(1)
                                 .map(_.toList)
                                 .filter { row =>
                                   row.lift(1).exists(_.nonEmpty) &&
                                   row.lift(7).exists(_.nonEmpty) &&
                                   row.lift(4).exists(_.nonEmpty) &&
                                   row.lift(2).exists(_.nonEmpty)
                                 }
                rowNum      <- Stream.eval(rowCounter.updateAndGet(_ + 1))
                _           <- Stream.eval(IO(println(s"[$rowNum] Row = ${columnsList.mkString(";\n")}")))
                companyId   <- Stream.emit(Company(columnsList)).evalMap {
                               case None          =>
                                 IO.raiseError(new IllegalStateException(s"corrupt record $rowNum"))
                               case Some(company) =>
                                 updateOrInsertCompany(company.name).transact(tx)
                             }
                _           <- Stream.eval(IO(println(s"[$rowNum] New company record inserted")))
                exchangeId  <- Stream.eval(IO(Exchange(columnsList))).attempt.evalMap {
                                case Right(Some(exchange)) => updateOrInsertExchange(exchange.name).transact(tx)
                                case Right(None)           =>
                                  IO.raiseError(new IllegalStateException(s"corrupt record $rowNum"))
                                case Left(_)               =>
                                  IO.raiseError(new IllegalStateException(s"corrupt record $rowNum"))
                              }
                _           <- Stream.eval(IO(Ticker(columnsList))).attempt.evalMap {
                       case Right(Some(ticker)) => updateOrInsertTicker(exchangeId, companyId, ticker).transact(tx)
                       case Right(None)         =>
                         IO.raiseError(new IllegalStateException(s"corrupt record $rowNum"))
                       case Left(_)             =>
                         IO.raiseError(new IllegalStateException(s"corrupt record $rowNum"))
                     }
              } yield {}

            program.compile.drain.unsafeRunSync()
        }
      }
    )
