graphql-error-tracking-extension
================================

This GraphQL extension for [Apollo Server 2](https://github.com/apollographql/apollo-server) adds two functionalities:
 
1. It helps you to **log the request context** in case of an Exception is happening in your GraphQL API. A trace-id will 
additionally help you to find the corresponding log entries.
1. You can define for which Exception types you do **not want to reveal the error** to the client and just return a
generic "internal server error"

Example log using this extension:

```
[dded97442947d] {"content-type":"application/json","cache-control":"no-cache","postman-token":"c824faa8-0287-406a-b326-bdbb173ee30d","authorization":"***","user-agent":"PostmanRuntime/7.6.0","accept":"*/*","host":"localhost:8080","accept-encoding":"gzip, deflate","content-length":"103","connection":"keep-alive"}
[dded97442947d] Syntax Error: Expected Name, found {
[dded97442947d] Original error body:  query {getSetting(settingsId:"123", language: "en") { features { {onPremises} }}
```

In this case you can easily see that the Exception was just caused by a syntax error. However, if you need to find
a real bug the corresponding query can be crucial.

## Usage

* Install the npm package as a dependency `npm i graphql-error-tracking-extension --save`
* Add this extension and the request to the GraphQL context like this:

```js
import {ApolloServer} from 'apollo-server-express';
import {GraphQLErrorTrackingExtension} from 'graphql-error-tracking-extension';

const server = new ApolloServer({
    schema,
    extensions: [() => new GraphQLErrorTrackingExtension()],
    context: ({req}) => ({
        request: req
    })
});
```

### Configuration

The GraphQLErrorTrackingExtension class takes an optional 
configuration object `new GraphQLErrorTrackingExtension(config)`.

#### maskHeaders

Replaces http headers with sensitive information with '***'.

**Default:** `['authorization']`

#### mapToInternalError

Define which error types (classes) should be mapped to a generic Internal Server Error before sending a response
to the client. Also have a look to the already available error types defined by Apollo Server 2 [link](https://www.apollographql.com/docs/apollo-server/features/errors.html) 

**Default:** `[]`

**Example** 

```js
import {ApolloServer, ApolloError, ForbiddenError} from 'apollo-server-express';
import {GraphQLErrorTrackingExtension} from 'graphql-error-tracking-extension';

const server = new ApolloServer({
    schema,
    extensions: [() => new GraphQLErrorTrackingExtension({
        mapToInternalError: [ApolloError, ForbiddenError]
    })],
    context: ({req}) => ({
        request: req
    })
});
```

Important: the array takes the JS classes, not strings!
