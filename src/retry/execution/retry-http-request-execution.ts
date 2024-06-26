import axios from "axios";
import { RetryIntervalStrategy } from "@/src/retry/models/retry-interval-options";
import { RetryPolicyType } from "@/src/retry/models/retry-policy-type";
import { computeRetryBackoffForStrategyInMilli as computeRetryBackoffForStrategyInMilli } from "@/src/retry/strategy/retry-backoff-strategy";
import { doesResponseHaveStatusCodeBlockedForRetry } from "@/src/retry/execution/utils/retry-utils";

/**
 * Executes the current HTTP request with a retry policy.
 *
 * @param httpRequest The current HTTP request.
 *
 * @param retryPolicyType The retry policy type, from {@link RetryPolicyType}.
 *
 * @returns A promise stating if the HTTP request was successful (resolved) or not (rejected when exceeds maximum amount of retry attempts).
 */
export default async function executeHttpRequestWithRetryPolicy(
  httpRequest: Promise<any>,
  retryPolicyType: RetryPolicyType
) {
  return await executeHttpRequestWithRetry(httpRequest, 0, retryPolicyType);
}

/**
 * Executes the current HTTP request with a retry policy.
 *
 * @param httpRequest The current HTTP request.
 *
 * @param currentAttempt The current retry attempt.
 *
 * @param retryPolicyType The retry policy type, from {@link RetryPolicyType}.
 *
 * @returns A promise stating if the HTTP request was successful (resolved) or not (rejected when exceeds maximum amount of retry attempts).
 */
async function executeHttpRequestWithRetry(
  httpRequest: Promise<any>,
  currentAttempt: number,
  retryPolicyType: RetryPolicyType
): Promise<any> {
  try {
    return await httpRequest;
  } catch (error: any) {
    if (doesResponseHaveStatusCodeBlockedForRetry(error, retryPolicyType)) {
      throw new Error(
        `The http status code of the response indicates that a retry shoudldn't happen. Status code received: ${error.response.status}`
      );
    }

    const maxNumberOfRetries = retryPolicyType.maxNumberOfRetries ?? 3;

    for (let i = 1; i <= maxNumberOfRetries; i++) {
      const nextAttempt = currentAttempt + 1;
      currentAttempt++;
      const retryBackoffStrategy =
        retryPolicyType.retryIntervalStrategy ??
        RetryIntervalStrategy.Linear_With_Jitter;

      const backoffRetryIntervalInMilli = computeRetryBackoffForStrategyInMilli(
        retryBackoffStrategy,
        nextAttempt,
        retryPolicyType.baseRetryDelayInMilli
      );

      await waitFor(backoffRetryIntervalInMilli);

      try {
        if (retryPolicyType.onRetry) retryPolicyType.onRetry();

        return await axios({
          method: error.config.method,
          url: error.config.url,
          headers: { ...error.config.headers },
          data: { ...error.config.data },
          proxy: false,
          timeout: 5000,
        });
      } catch (error) {
        continue;
      }
    }

    throw new Error(
      `The number of retries (${maxNumberOfRetries}) has exceeded.`
    );
  }
}

/**
 * Simulates a waiting time
 * @param timeoutInMilli Time to wait in milliseconds.
 * @returns A promise that gets resolved after a given amount of time defined in {@link timeoutInMilli}.
 */
function waitFor(timeoutInMilli: number) {
  return new Promise((resolve) => setTimeout(resolve, timeoutInMilli));
}
