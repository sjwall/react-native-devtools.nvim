import {Result, ok, err} from 'neverthrow'
import {HttpError, NetworkError, ApiError} from '../types/ApiError'

/**
 * Fetches data from a URL and parses it as JSON.
 * Handles network errors and HTTP errors (non-2xx responses).
 *
 * @param url The URL to fetch.
 * @returns A Result containing the parsed JSON data on success, or an ApiError on failure.
 */
export async function fetchData<T>(
  url: string,
  options?: RequestInit,
): Promise<Result<T, ApiError>> {
  try {
    const response = await fetch(url, options)

    if (!response.ok) {
      let errorBody: any
      try {
        errorBody = await response.json()
      } catch (jsonError) {
        errorBody = await response.text()
      }
      return err(
        new HttpError(
          `HTTP error: ${response.status} ${response.statusText}`,
          response.status,
          errorBody,
        ),
      )
    }

    try {
      const data: T = await response.json()
      return ok(data)
    } catch (jsonParseError) {
      return err(new Error(`Failed to parse JSON: ${jsonParseError}`))
    }
  } catch (error) {
    if (error instanceof Error) {
      return err(new NetworkError(error))
    }
    return err(new Error(`An unknown error occurred: ${error}`))
  }
}
