import sbt._
import sbt.Keys._

name := "tradersclub-data-loader"

version := "0.1"

scalaVersion := "2.13.4"

Test / fork := true

enablePlugins(JavaAppPackaging)

libraryDependencies += "co.fs2"    %% "fs2-core"     % Versions.fs2Version
libraryDependencies += "co.fs2"    %% "fs2-io"       % Versions.fs2Version
libraryDependencies += "org.gnieh" %% "fs2-data-csv" % Versions.fs2DataVersion

libraryDependencies += "com.monovore" %% "decline" % "1.3.0"

libraryDependencies += "org.tpolecat" %% "doobie-hikari"   % Versions.doobieVersion
libraryDependencies += "org.tpolecat" %% "doobie-postgres" % Versions.doobieVersion
libraryDependencies += "org.tpolecat" %% "doobie-core"     % Versions.doobieVersion

libraryDependencies += "com.typesafe.scala-logging" %% "scala-logging"   % Versions.scalaLoggingVersion
libraryDependencies += "ch.qos.logback"              % "logback-classic" % Versions.logbackVersion

libraryDependencies += "com.github.pureconfig" %% "pureconfig-enum" % Versions.pureConfigVersion
libraryDependencies += "com.github.pureconfig" %% "pureconfig"      % Versions.pureConfigVersion

val elastic4sVersion = "7.12.0"
libraryDependencies ++= Seq(
  // recommended client for beginners
  "com.sksamuel.elastic4s" %% "elastic4s-effect-cats" % elastic4sVersion,
  "com.sksamuel.elastic4s" %% "elastic4s-client-esjava" % elastic4sVersion,
  // test kit
  "com.sksamuel.elastic4s" %% "elastic4s-testkit" % elastic4sVersion % "test"
)

libraryDependencies ++= Seq(
  "io.circe" %% "circe-core",
  "io.circe" %% "circe-generic",
  "io.circe" %% "circe-parser"
).map(_ % "0.12.3")