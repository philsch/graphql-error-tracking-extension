/* eslint-disable-next-line import/no-unresolved */
import {GraphQLExtension} from "graphql-extensions";
import {TraceId} from "./TraceId";

/**
 * Extension to track and handle GraphQL errors
 */
class GraphQLErrorTrackingExtension extends GraphQLExtension {
  /**
   *
   * @param config
   */
  constructor(config = {}) {
    super();

    this.config = {};
    this.config.maskHeaders = Array.isArray(config.maskHeaders) ? config.maskHeaders : ['authorization'];
    this.config.mapToInternalError = Array.isArray(config.mapToInternalError) ? config.mapToInternalError : [];
  }

  /**
   * Removes newline chars
   *
   * @param str
   * @return {String}
   */
  static removeNewlines(str) {
    return str.replace(/(?:\r\n|\r|\n)/g, ' ');
  }

  /**
   * Mask sensible information so we do not log credentials
   * @param {Object} header
   * @return {Object} Copy of header with sensible information replaced
   */
  maskHeader(header) {
    const headerCopy = JSON.parse(JSON.stringify(header));

    this.config.maskHeaders.forEach((headerKey) => {
      headerKey = headerKey.toLowerCase();
      if (headerCopy[headerKey]) {
        headerCopy[headerKey] = '***';
      }
    });

    return headerCopy;
  }


  /**
   * Handle errors returned by GraphQL
   *
   * @param errors
   * @param headers
   * @return {Array}
   */
  handleErrors(errors, headers) {
    const traceId = TraceId.generate();
    const maskedHeaders = this.maskHeader(headers);

    return errors.map((error) => (this.handleError(error, maskedHeaders, traceId)));

  }

  /**
   * Handle single error returned by GraphQL
   *
   * @param err
   * @param headers
   * @param traceId
   * @return {Error}
   */
  handleError(err, headers, traceId) {
    console.error(`[${traceId}] ${JSON.stringify(headers)}`);
    console.error(`[${traceId}] ${err.name} ${err.message}`);

    if (err.source && err.source.body) {
      const body = GraphQLErrorTrackingExtension.removeNewlines(err.source.body);
      console.error(`[${traceId}] Error body: ${body}`);
    }
    if (err.originalError && err.originalError.source && err.originalError.source.body) {
      const body = GraphQLErrorTrackingExtension.removeNewlines(err.originalError.source.body);
      console.error(`[${traceId}] Original error body: ${body}`);
    }

    for (const errorClass of this.config.mapToInternalError) {
      if (err.originalError instanceof errorClass || err instanceof errorClass) {
        return new Error('Internal Server Error');
      }
    }

    return err;
  }

  /**
   * Triggered before response is send back to the client
   *
   * @param o
   * @return {{graphqlResponse: GraphQLResponse; context: TContext}}
   */
  willSendResponse(o) {
    const {context, graphqlResponse} = o;
    if (graphqlResponse.errors) {
      graphqlResponse.errors = this.handleErrors(graphqlResponse.errors, context.request.headers);
    }
    return o;
  }
}

export {GraphQLErrorTrackingExtension};
