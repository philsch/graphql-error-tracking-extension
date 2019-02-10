import {GraphQLErrorTrackingExtension} from "../../src/lib/GraphQLErrorTrackingExtension";
import {SyntaxError, UserInputError} from 'apollo-server-express';

describe('GraphQLErrorTrackingExtension', () => {
  describe('removeNewlines', () => {
    it('Removes new lines from strings', () => {
      const strWithNewline = "String\nwith\nnew\nlines";
      const result = GraphQLErrorTrackingExtension.removeNewlines(strWithNewline);

      expect(result).toEqual('String with new lines');
    });
  });

  describe('maskHeader', () => {
    it('masks authorization header by default', () => {
      const extension = new GraphQLErrorTrackingExtension();
      const exampleHeaders = {'authorization': 'secret-token'};
      const maskedHeaders = extension.maskHeader(exampleHeaders);

      expect(maskedHeaders.authorization).toEqual('***');

    });

    it('masks specified headers', () => {
      const config = {maskHeaders: ['authorization', 'x-other-header']};
      const extension = new GraphQLErrorTrackingExtension(config);
      const exampleHeaders = {'authorization': 'secret-token', 'x-other-header': 'secret'};
      const maskedHeaders = extension.maskHeader(exampleHeaders);

      expect(maskedHeaders.authorization).toEqual('***');
      expect(maskedHeaders['x-other-header']).toEqual('***');
    });

    it('does not change the oriignal headers object', () => {
      const extension = new GraphQLErrorTrackingExtension();
      const exampleHeaders = {'authorization': 'secret-token'};
      const maskedHeaders = extension.maskHeader(exampleHeaders);

      expect(maskedHeaders.authorization).toEqual('***');
      expect(exampleHeaders.authorization).toEqual('secret-token');
    });
  });

  describe('error handling', () => {
    beforeEach(() => {
      console.error = jest.fn();
    });

    afterEach(() => {
      console.error.mockRestore();
    });

    it('forwards errors unmodified if no mapping to internal errors is set', () => {
      const extension = new GraphQLErrorTrackingExtension();
      const errors = [
        new SyntaxError('error one'),
        new SyntaxError('error two'),
      ];

      const forwardedErrors = extension.handleErrors(errors, {});
      expect(forwardedErrors[0]).toBeInstanceOf(SyntaxError);
      expect(forwardedErrors[1]).toBeInstanceOf(SyntaxError);
    });

    it('forwards generic errors if mapping to internal errors is set', () => {
      const config = {mapToInternalError: [SyntaxError]};
      const extension = new GraphQLErrorTrackingExtension(config);
      const errors = [
        new SyntaxError('error one'),
        new UserInputError('error two'),
      ];

      const forwardedErrors = extension.handleErrors(errors, {});
      expect(forwardedErrors[0]).toBeInstanceOf(Error);
      expect(forwardedErrors[0]).not.toBeInstanceOf(SyntaxError);
      expect(forwardedErrors[1]).toBeInstanceOf(UserInputError);
    });
  });
});
