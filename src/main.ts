import { ClassSerializerInterceptor, ValidationPipe } from '@nestjs/common';
import { NestFactory, Reflector } from '@nestjs/core';
import cookieParser from 'cookie-parser';
import { config } from 'dotenv';
import { AppModule } from './app.module';

config();

async function bootstrap() {
  console.log('NODE_ENV:', process.env.NODE_ENV);
  const app = await NestFactory.create(AppModule);

  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));

  const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:4321',
    'http://localhost:5173',
    'http://localhost:5174',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:4321',
    'http://127.0.0.1:5173',
    'https://app.pakasir.com',
    'https://sandbox.pakasir.com',
    ...(process.env.ALLOW_ORIGINS
      ? process.env.ALLOW_ORIGINS.split(',').map((o) => o.trim())
      : []),
  ];

  app.enableCors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'Accept',
      'Origin',
      'X-Requested-With',
      'Access-Control-Request-Method',
      'Access-Control-Request-Headers',
      'x-lang',
    ],
    exposedHeaders: ['Authorization'],
    optionsSuccessStatus: 200, // Untuk legacy browser support
  });
  app.useGlobalPipes(
    new ValidationPipe({
      /** Hilangkan field yang tidak ada di DTO (cegah mass-assignment / injeksi properti). */
      whitelist: true,
      /** Cast query string ke number/dll. sesuai tipe DTO. */
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );
  app.setGlobalPrefix('api');
  app.use(cookieParser());

  await app.listen(process.env.PORT, () => {
    console.log(`Server is running at http://localhot:${process.env.PORT}`);
  });
}
bootstrap();
