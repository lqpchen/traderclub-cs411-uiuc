package edu.illinois.tradersclub.loader

import cats.effect.{ ConcurrentEffect, ContextShift, IO, Timer }

import scala.concurrent.ExecutionContext

package object ioutils {

  implicit val contextShift: ContextShift[IO]   = IO.contextShift(ExecutionContext.global)
  implicit val concurrent: ConcurrentEffect[IO] = IO.ioConcurrentEffect
  implicit val timer: Timer[IO]                 = IO.timer(ExecutionContext.global)

}
