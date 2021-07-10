package edu.illinois.tradersclub.loader.apps

import cats.effect._
import cats.implicits._
import com.monovore.decline.{CommandApp, Opts}
import com.sksamuel.elastic4s.ElasticApi._
import com.sksamuel.elastic4s.http._
import com.sksamuel.elastic4s.fields.{DateField, LongField, TextField}
import com.sksamuel.elastic4s.{ElasticClient, ElasticProperties}
import com.sksamuel.elastic4s.http.JavaClient
import com.sksamuel.elastic4s.requests.common.RefreshPolicy
import doobie.implicits._
import edu.illinois.tradersclub.loader.config._
import edu.illinois.tradersclub.loader.db._
import edu.illinois.tradersclub.loader.db.data.{Company, Exchange, StockArticle, Ticker}
import edu.illinois.tradersclub.loader.db.sql._
import edu.illinois.tradersclub.loader.ioutils._
import fs2.Stream
import fs2.concurrent.SignallingRef
import fs2.data.csv.rows

import java.io.File
import scala.io.Source

object ArticlesLoader
    extends CommandApp(
      name = "load-articles",
      header = "load articles list",
      main = {
        val pathOpt =
          Opts.option[String]("path", help = "Path to the articles CSV file")

        val allowUpdatesOpt  =
          Opts.flag("allow-updates", help = "Updates existing DB records in case of a conflict")
            .orFalse

        val elasticSearchUrlOpt =
          Opts.option[String]("elastic-search-url", help = "Elasticsearch URL")


        (pathOpt, allowUpdatesOpt, elasticSearchUrlOpt).mapN {
          (path, allowUpdates, elasticSearchUrl) =>

            val (transactor, _) = buildTransactor(databaseConfig)

            val parseLine = rows[IO](',')

            import com.sksamuel.elastic4s.ElasticDsl._

            def clientResource: Resource[IO, ElasticClient] = Resource.make {
              IO.delay { ElasticClient(JavaClient(ElasticProperties(elasticSearchUrl))) }
            } (c => IO.delay { c.close() })

            val program = clientResource.use { client =>
              val stream = for {
                _ <- Stream.eval(
                  IO.fromFuture(
                    IO {
                      client.execute {
                        createIndex("stock_articles").mapping(
                          properties(
                            TextField("category"),
                            TextField("provider"),
                            TextField("content"),
                            TextField("headline"),
                            TextField("stock_symbol"),
                            DateField("release_date"),
                            LongField("stock_id"),
                            LongField("article_id")
                          )
                        )
                      }
                    }
                  )
                )
                rowCounter <- Stream.eval(SignallingRef.apply[IO, Int](0))
                processedCounter <- Stream.eval(SignallingRef.apply[IO, Int](0))
                input <- Stream.eval(IO(Source.fromFile(new File(path))))
                tx <- Stream.eval(transactor)
                columnsList <- Stream
                  .emits(input.getLines().mkString("\n"))
                  .through(parseLine)
                  .drop(1)
                  .map(_.toList)
                rowNum <- Stream.eval(rowCounter.updateAndGet(_ + 1))
                _ <- Stream.emit(StockArticle(columnsList)).evalMap {
                  case None =>
                    IO(Console.out.println(s"ERR>> Corrupt record at $rowNum"))
                  case Some(article) =>
                    findStockIdBySymbol(article.symbol).transact(tx).flatMap {
                      case Some(stockId) =>
                        updateOrInsertArticle(stockId, article, allowUpdates).transact(tx).flatMap { articleId =>
                          IO.fromFuture(
                            IO(
                              client.execute {
                                indexInto("stock_articles")
                                  .id(article.article_id.toString)
                                  .fields(
                                    "category" -> article.category,
                                    "provider" -> article.provider,
                                    "content" -> article.content,
                                    "headline" -> article.title,
                                    "article_id" -> articleId,
                                    "stock_id" -> stockId,
                                    "stock_symbol" -> article.symbol,
                                    "release_date" -> article.release_date.getTime
                                  )
                              }
                            )
                          ).flatMap(response =>
                             IO(Console.out.println(s"Inserted: ${response}"))
                          ) >>
                          processedCounter.update(_ + 1)
                        }
                      case None =>
                        IO.unit
                    }
                }
                _ <- Stream.eval(processedCounter.get)
                  .evalMap {
                    case processedNum if processedNum > 0 && processedNum % 100 == 0 =>
                      IO(Console.out.println(s"[status] ${processedNum} records processed"))
                    case _ =>
                      IO.unit
                  }

              } yield {}

              stream.compile.drain
            }

            program.unsafeRunSync()
        }
      }
    )
