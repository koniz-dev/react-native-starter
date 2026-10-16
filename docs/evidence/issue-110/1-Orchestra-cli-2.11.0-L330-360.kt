                    try {
                        executeCommand(evaluatedCommand, config)
                        dispatchFinished(command, CommandOutcome.Completed, sequenceNumber)
                        onCommandComplete(index, command)
                    } catch (e: MaestroException) {
                        val isOptional =
                            command.asCommand()?.optional == true || command.elementSelector()?.optional == true
                        if (isOptional) throw CommandWarned(e.message)
                        else throw e
                    }
                } catch (ignored: CommandWarned) {
                    logger.info("[Command execution] CommandWarned: ${ignored.message}")
                    // Swallow exception, but add a warning as an insight
                    insights.report(Insight(message = ignored.message, level = Insight.Level.WARNING))
                    dispatchFinished(command, CommandOutcome.Warned, sequenceNumber)
                    onCommandWarned(index, command)
                } catch (ignored: CommandSkipped) {
                    logger.info("[Command execution] CommandSkipped: ${ignored.message}")
                    // Swallow exception
                    dispatchFinished(command, CommandOutcome.Skipped, sequenceNumber)
                    onCommandSkipped(index, command)
                } catch (e: CancellationException) {
                    throw e
                } catch (e: DeviceConnectionException) {
                    throw e
                } catch (e: Throwable) {
                    logger.error("[Command execution] CommandFailed: ${e.message}")
                    dispatchFinished(command, CommandOutcome.Failed(e), sequenceNumber)
                    val errorResolution = onCommandFailed(index, command, e)
                    when (errorResolution) {
                        ErrorResolution.FAIL -> return false
