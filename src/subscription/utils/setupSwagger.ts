// import * as basicAuth from 'express-basic-auth';

import { INestApplication } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

export function setupSwagger(app: INestApplication): void {
  // app.use(
  //   ['/api', '/api-docs'],
  //   basicAuth({
  //     challenge: true,
  //     users: {
  //       platfarm: 'mojitok',
  //     },
  //   })
  // );
  const options = new DocumentBuilder().setTitle('Nft FloorPrice Tracking Docs').setDescription('nft tracking of opensea stream api').setVersion('1.0.0').build();
  const document = SwaggerModule.createDocument(app, options);
  SwaggerModule.setup('api', app, document);
}
