package edu.illinois.tradersclub.loader.db

import io.circe.Json

import java.sql.Timestamp
import java.time.LocalDate
import scala.util.Try

package object data {

  object StockArticle {
    def apply(columns: List[String]): Option[StockArticle] =
      for {
        id    <- columns.headOption.map(_.toLong)
        ticker <- columns.lift(1)
        title <- columns.lift(2)
        category    <- columns.lift(3)
        content    <- columns.lift(4)
        release_date    <- columns.lift(5).map(LocalDate.parse(_).atStartOfDay()).map(Timestamp.valueOf)
        provider    <- columns.lift(6)
        url    <- columns.lift(7)
        article_id    <- columns.lift(8).map(_.toLong)
      } yield {
        StockArticle(ticker, id, title, category, content, release_date, provider, url, article_id)
      }
  }

  case class StockArticle(symbol: String,
                          id: Long,
                          title: String,
                          category: String,
                          content: String,
                          release_date: Timestamp,
                          provider: String,
                          url: String,
                          article_id: Long)

  case class Financials(symbol: String,
                        startDate: Timestamp,
                        endDate: Timestamp,
                        year: Int,
                        data: Json)

  object Quote {
    def apply(symbol: String, stockId: Long, columns: List[String]): Option[Quote] =
      for {
        date    <- columns.headOption
        timestamp <- Try(LocalDate.parse(date).atStartOfDay()).map(Timestamp.valueOf).toOption
        volume <- columns.lift(1).map(_.toLong)
        open    <- columns.lift(2).map(_.toDouble)
        high    <- columns.lift(3).map(_.toDouble)
        low    <- columns.lift(4).map(_.toDouble)
        close    <- columns.lift(5).map(_.toDouble)
        adjustedClose    <- columns.lift(6).map(_.toDouble)
      } yield Quote(symbol, stockId, timestamp, volume, open, high, low, close, adjustedClose)
  }

  case class Quote(symbol: String, stockId: Long,
                   date: Timestamp, volume: Long, open: Double, high: Double, low: Double,
                   close: Double, adjustedClose: Double)

  object Company {
    def apply(columns: List[String]): Option[Company] =
      columns.lift(2).map { name =>
        Company(name)
      }
  }

  case class Company(name: String)

  object Ticker {
    def apply(columns: List[String]): Option[Ticker] =
      for {
        cik    <- columns.headOption.map(_.toLong)
        symbol <- columns.lift(1)
        sic    <- columns.lift(4).map(_.toLong)
        irs    <- columns.lift(7).map(_.toLong)
      } yield Ticker(cik, symbol, sic, irs)
  }

  case class Ticker(cikNumber: Long, symbol: String, sicNumber: Long, irsNumber: Long)

  object Exchange {
    def apply(columns: List[String]): Option[Exchange] =
      columns.lift(3).map { name =>
        Exchange(name)
      }
  }

  case class Exchange(name: String)

}
