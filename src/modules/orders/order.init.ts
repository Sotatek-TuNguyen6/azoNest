import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Counter, CounterDocument } from './schemas/counter.schema';

@Injectable()
export class OrderServiceInit implements OnModuleInit {
    constructor(
        @InjectModel(Counter.name) private counterModel: Model<CounterDocument>,
    ) { }

    // Hàm này sẽ chạy khi module khởi tạo
    async onModuleInit() {
        // Kiểm tra xem bản ghi 'orderCode' đã tồn tại chưa
        const counter = await this.counterModel.findOne({ id: 'orderCode' });

        // Nếu chưa tồn tại, tạo bản ghi mới với giá trị seq ban đầu là 1
        if (!counter) {
            await this.counterModel.create({ id: 'orderCode', seq: 1 });
            console.log('Created initial Counter for orderCode');
        }
    }
}
