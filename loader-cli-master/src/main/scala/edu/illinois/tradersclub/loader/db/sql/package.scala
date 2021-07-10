package edu.illinois.tradersclub.loader.db

import doobie.{ConnectionIO, FC, LogHandler}
import doobie.implicits._
import edu.illinois.tradersclub.loader.db.data.{Financials, Quote, StockArticle, Ticker}
import doobie.implicits.javasql._
import doobie.postgres._
import doobie.postgres.implicits._
import doobie.postgres.pgisimplicits._

package object sql {

  def testConnection: ConnectionIO[Int] =
    sql"""
         select 1;
      """
      .query[Int]
      .option
      .map(_.getOrElse(0))

  def findStockIdBySymbol(symbol: String): ConnectionIO[Option[Long]] = {
    sql"""
       select id from stock
       where symbol = $symbol
       limit 1
     """
      .query[Long]
      .option
  }

  def findStockIdBySymbol(symbol: String, exchangeSymbol: String): ConnectionIO[Option[Long]] = {
    sql"""
       select stock.id from stock
       left join stock_exchange se on se.id = stock.stock_exchange_id
       where stock.symbol = $symbol and se.symbol = $exchangeSymbol
     """
      .query[Long]
      .option
  }

  def updateOrInsertQuote(quote: Quote, allowUpdates: Boolean = false): ConnectionIO[Int] = {
    def insert0: doobie.ConnectionIO[Int] =
      sql"""
                insert into quote (quote_date, quote_open, quote_close, high, low, volume, adjusted_close, stock_id)
                  values(${quote.date}, ${quote.open}, ${quote.close}, ${quote.high}, ${quote.low}, ${quote.volume}, ${quote.adjustedClose}, ${quote.stockId})
                  on conflict DO NOTHING ;
             """
      .update
      .run

    if (allowUpdates) {
      sql"""
        select id from quote where quote_date = ${quote.date} and stock_id = ${quote.stockId}
      """
        .query[Long]
        .option
        .flatMap {
          case None =>
            insert0
          case Some(_) =>
            sql"""
                update quote
                  set
                    quote_open = ${quote.open},
                    quote_close = ${quote.close},
                    high = ${quote.high},
                    low = ${quote.low},
                    volume = ${quote.volume},
                    adjusted_close = ${quote.adjustedClose}
                  where
                    quote_date = ${quote.date} and stock_id = ${quote.stockId}
             """
              .update
              .run
        }
    } else insert0
  }

  def updateOrInsertFinancials(stockId: Long, financials: Financials, allowUpdates: Boolean = false): ConnectionIO[Int] = {
    def insert0: doobie.ConnectionIO[Int] =
      sql"""
                insert into stock_financials (start_date, end_date, year, stock_id, data)
                  values(${financials.startDate}, ${financials.endDate}, ${financials.year}, ${stockId}, ${financials.data})
                  on conflict DO NOTHING ;
             """
        .update
        .run

    if (allowUpdates) {
      sql"""
        select id from stock_financials where stock_id = ${stockId} and start_date = ${financials.startDate} and end_date = ${financials.endDate}
      """
        .query[Long]
        .option
        .flatMap {
          case None =>
            insert0
          case Some(_) =>
            sql"""
                update stock_financials
                  set
                    data = ${financials.data},
                    year = ${financials.year}
                  where
                    stock_id = ${stockId}
                    and start_date = ${financials.startDate}
                    and end_date = ${financials.endDate}
             """
              .update
              .run
        }
    } else insert0
  }

  def updateOrInsertArticle(stockId: Long, article: StockArticle, allowUpdates: Boolean = false): ConnectionIO[Long] = {
    def insert0: doobie.ConnectionIO[Long] =
      sql"""
                insert into stock_article (external_id, headline, url, author_name, stock_id, content, release_date)
                  values(${article.id.toString}, ${article.title}, ${article.url}, ${article.provider}, ${stockId}, ${article.content}, ${article.release_date})
                  on conflict DO NOTHING ;
             """
        .update
        .withUniqueGeneratedKeys("id")

    if (allowUpdates) {
      sql"""
        select id from stock_article where external_id = ${article.id.toString} and stock_id = ${stockId}
      """
        .query[Long]
        .option
        .flatMap {
          case None =>
            insert0
          case Some(id) =>
            sql"""
                update stock_article
                  set
                    headline = ${article.title},
                    author_name = ${article.provider},
                    url = ${article.url},
                    release_date = ${article.release_date}
                  where
                    external_id = ${article.id.toString()}
                    and stock_id = $stockId
             """
              .update
              .run
              .map { _ =>
                id
              }
        }
    } else insert0
  }

  def updateOrInsertCompany(
      name: String
  ): ConnectionIO[Long] =
    sql"""
         select id from company
            where name = $name
       """
      .query[Long]
      .option
      .flatMap {
        case Some(id) => FC.pure(id)
        case None     =>
          sql"""
               insert into company (name) values($name)
             """.update
            .withUniqueGeneratedKeys("id")
      }

  def updateOrInsertExchange(
      name: String
  ): ConnectionIO[Long] =
    sql"""
         select id from stock_exchange
            where symbol = $name
       """
      .query[Long]
      .option
      .flatMap {
        case Some(id) => FC.pure(id)
        case None     =>
          sql"""
               insert into stock_exchange (symbol) values($name)
             """.update
            .withUniqueGeneratedKeys("id")
      }

  def updateOrInsertTicker(
      exchangeId: Long,
      companyId: Long,
      ticker: Ticker
  ): ConnectionIO[Long] =
    sql"""
         select id from stock where symbol = ${ticker.symbol} and stock_exchange_id = $exchangeId
       """
      .query[Long]
      .option
      .flatMap {
        case Some(id) =>
          FC.pure(id)
        case None     =>
          sql"""
               insert into stock (symbol, company_id, stock_exchange_id, cik_number, irs_number, sec_number)
                values (${ticker.symbol}, ${companyId}, ${exchangeId}, ${ticker.cikNumber}, ${ticker.irsNumber}, ${ticker.sicNumber})
             """.update
            .withUniqueGeneratedKeys("id")
      }

}
