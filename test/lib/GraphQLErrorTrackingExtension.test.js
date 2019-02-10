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

    it('does not change the orignal headers object', () => {
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

    it('forwards errors unmodified if revealErrorTypes is not set', () => {
      const extension = new GraphQLErrorTrackingExtension();
      const errors = [
        new SyntaxError('error one'),
        new SyntaxError('error two'),
      ];

      const forwardedErrors = extension.handleErrors(errors, {});
      expect(forwardedErrors[0]).toBeInstanceOf(SyntaxError);
      expect(forwardedErrors[0].message).toEqual('error one');
      expect(forwardedErrors[1]).toBeInstanceOf(SyntaxError);
      expect(forwardedErrors[1].message).toEqual('error two');
    });

    it('forwards errors unmodified if defined in revealErrorTypes', () => {
      const config = {revealErrorTypes: [UserInputError]};
      const extension = new GraphQLErrorTrackingExtension(config);
      const errors = [
        new SyntaxError('error one'),
        new UserInputError('error two'),
      ];

      const forwardedErrors = extension.handleErrors(errors, {});
      expect(forwardedErrors[0]).toBeInstanceOf(Error);
      expect(forwardedErrors[0]).not.toBeInstanceOf(SyntaxError);
      expect(forwardedErrors[0].message).toEqual('Internal Server Error');
      expect(forwardedErrors[1]).toBeInstanceOf(UserInputError);
      expect(forwardedErrors[1].message).toEqual('error two');
    });

    it('modifes all errors if revealErrorTypes is empty array', () => {
      const config = {revealErrorTypes: []};
      const extension = new GraphQLErrorTrackingExtension(config);
      const errors = [
        new SyntaxError('error one'),
        new UserInputError('error two'),
        new Error('error three'),
      ];

      const forwardedErrors = extension.handleErrors(errors, {});
      expect(forwardedErrors[0]).toBeInstanceOf(Error);
      expect(forwardedErrors[0]).not.toBeInstanceOf(SyntaxError);
      expect(forwardedErrors[1]).toBeInstanceOf(Error);
      expect(forwardedErrors[1]).not.toBeInstanceOf(UserInputError);
      expect(forwardedErrors[2]).toBeInstanceOf(Error);
      expect(forwardedErrors[2].message).toEqual('Internal Server Error');
    });
  });
});
