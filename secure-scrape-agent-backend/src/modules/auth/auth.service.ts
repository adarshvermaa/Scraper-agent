import { Injectable } from '@nestjs/common';
import { PrismaService } from '@modules/database/prisma.service';
import * as bcrypt from 'bcrypt';
import Logger from '@common/logger';

export interface User {
    id: string;
    email: string;
    name: string;
    role: 'admin' | 'user';
    createdAt: Date;
}

export interface CreateUserDto {
    email: string;
    password: string;
    name: string;
    role?: 'admin' | 'user';
}

@Injectable()
export class AuthService {
    constructor(private prisma: PrismaService) { }

    async createUser(data: CreateUserDto): Promise<User> {
        const hashedPassword = await bcrypt.hash(data.password, 10);

        const user = await this.prisma.user.create({
            data: {
                email: data.email,
                password: hashedPassword,
                name: data.name,
                role: data.role || 'user',
            },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                createdAt: true,
            },
        });

        Logger.info({ userId: user.id, email: user.email }, 'User created');
        return user as User;
    }

    async validateUser(email: string, password: string): Promise<User | null> {
        const user = await this.prisma.user.findUnique({
            where: { email },
        });

        if (!user) {
            return null;
        }

        const isValid = await bcrypt.compare(password, user.password);
        if (!isValid) {
            return null;
        }

        return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role as 'admin' | 'user',
            createdAt: user.createdAt,
        };
    }

    async findUserById(id: string): Promise<User | null> {
        const user = await this.prisma.user.findUnique({
            where: { id },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                createdAt: true,
            },
        });

        return user as User | null;
    }
}
