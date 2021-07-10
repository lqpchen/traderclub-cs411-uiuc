package edu.illinois.tradersclub.loader

import com.typesafe.config.ConfigFactory
import pureconfig.ConfigSource
import pureconfig.generic.auto._

package object config {

  case class Password(value: String) extends AnyVal {
    override def toString = "PASSWORD"
  }

  case class DatabaseConfig(
      driverClassName: String,
      jdbcUri: String,
      userName: String,
      password: Password
  )

  final val config         = ConfigSource.fromConfig(ConfigFactory.load())
  final val databaseConfig = config.at("db").loadOrThrow[DatabaseConfig]

}
