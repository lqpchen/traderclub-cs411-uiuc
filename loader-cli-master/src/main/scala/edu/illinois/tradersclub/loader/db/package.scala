package edu.illinois.tradersclub.loader

import cats.effect.{Blocker, ContextShift, IO}
import cats.implicits._
import io.circe.parser._
import com.zaxxer.hikari.{HikariConfig, HikariDataSource}
import doobie.Transactor
import doobie.hikari.HikariTransactor
import doobie.util.log.{ExecFailure, LogHandler, ProcessingFailure, Success}
import doobie.util.meta.Meta
import edu.illinois.tradersclub.loader.apps.QuotesLoader
import edu.illinois.tradersclub.loader.config.DatabaseConfig
import edu.illinois.tradersclub.loader.ioutils._
import io.circe.Json
import org.postgresql.util.PGobject

import java.util.concurrent.Executors
import java.util.logging.Logger
import scala.concurrent.ExecutionContext

package object db {

  def buildTransactor(databaseConfig: DatabaseConfig): (IO[Transactor[IO]], Int) = {
    val dbTransactExecutionContext: ExecutionContext = ExecutionContext.fromExecutor {
      Executors.newCachedThreadPool
    }

    val dbExecutionContext: ExecutionContext = ExecutionContext.fromExecutor {
      Executors.newFixedThreadPool(6)
    }

    val dataSourceConfig = new HikariConfig
    dataSourceConfig.setAutoCommit(false)
    dataSourceConfig.setDriverClassName(databaseConfig.driverClassName)
    dataSourceConfig.setJdbcUrl(databaseConfig.jdbcUri)
    dataSourceConfig.setUsername(databaseConfig.userName)
    dataSourceConfig.setPassword(databaseConfig.password.value)
    dataSourceConfig.setMaximumPoolSize(32)
    dataSourceConfig.setMinimumIdle(1)

    val transactorIO = IO {
      HikariTransactor.apply(
        new HikariDataSource(dataSourceConfig),
        dbExecutionContext,
        Blocker.liftExecutionContext(dbTransactExecutionContext)
      )
    }

    (transactorIO, 32)
  }

  implicit val jsonMeta: Meta[Json] =
    Meta.Advanced.other[PGobject]("json").timap[Json](
      a => parse(a.getValue).leftMap[Json](e => throw e).merge)(
      a => {
        val o = new PGobject
        o.setType("json")
        o.setValue(a.noSpaces)
        o
      }
    )

  implicit val logHandler: LogHandler = {
    val jdkLogger = Logger.getLogger(classOf[QuotesLoader.type].getName)
    LogHandler {
      case _: Success =>
      case ProcessingFailure(s, a, e1, e2, t) =>
        jdkLogger.severe(s"""Failed Resultset Processing:
                            |
                            |  ${s.linesIterator.dropWhile(_.trim.isEmpty).mkString("\n  ")}
                            |
                            | arguments = [${a.mkString(", ")}]
                            |   elapsed = ${e1.toMillis} ms exec + ${e2.toMillis} ms processing (failed) (${(e1 + e2).toMillis} ms total)
                            |   failure = ${t.getMessage}
              """.stripMargin)

      case ExecFailure(s, a, e1, t) =>
        jdkLogger.severe(s"""Failed Statement Execution:
                            |
                            |  ${s.linesIterator.dropWhile(_.trim.isEmpty).mkString("\n  ")}
                            |
                            | arguments = [${a.mkString(", ")}]
                            |   elapsed = ${e1.toMillis} ms exec (failed)
                            |   failure = ${t.getMessage}
              """.stripMargin)

    }
  }
}
