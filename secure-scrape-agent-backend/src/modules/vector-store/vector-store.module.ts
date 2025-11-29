import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MilvusService } from './milvus.service';
import { PineconeService } from './pinecone.service';
import { IVectorStore } from './vector-store.interface';

export const VECTOR_STORE_TOKEN = 'VECTOR_STORE';

@Module({
  providers: [
    MilvusService,
    PineconeService,
    {
      provide: VECTOR_STORE_TOKEN,
      useFactory: (
        configService: ConfigService,
        milvusService: MilvusService,
        pineconeService: PineconeService,
      ): IVectorStore => {
        const usePinecone = configService.get<boolean>('milvus.usePinecone');
        return usePinecone ? pineconeService : milvusService;
      },
      inject: [ConfigService, MilvusService, PineconeService],
    },
  ],
  exports: [VECTOR_STORE_TOKEN, MilvusService, PineconeService],
})
export class VectorStoreModule {}
