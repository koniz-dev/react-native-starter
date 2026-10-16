    private suspend fun retryCommand(command: RetryCommand, config: MaestroConfig?): Boolean {
        val maxRetries = (command.maxRetries?.toIntOrNull() ?: 1).coerceAtMost(MAX_RETRIES_ALLOWED)

        // Retry is intended for flaky test-level failures — element not found, assertion
        // failures, etc. — which all surface as MaestroException. Anything else (driver
        // transport failures, JS evaluation bugs, CancellationException) propagates naturally.
        var attempt = 0
        while (attempt <= maxRetries) {
            try {
                return runSubFlow(command.commands, config, command.config)
            } catch (exception: MaestroException) {
                if (attempt == maxRetries) {
                    logger.error("Max retries ($maxRetries) reached. Commands failed.", exception)
                    throw exception
                }

                val message =
                    "Retrying the commands due to an error: ${exception.message} while execution (Attempt ${attempt + 1})"
                logger.error("Attempt ${attempt + 1} failed for retry command", exception)
