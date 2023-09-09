import {Injectable, InternalServerErrorException, BadRequestException, Logger, NotFoundException} from '@nestjs/common';
import {InjectRepository} from '@nestjs/typeorm';
import {DataSource, Repository} from 'typeorm';
import {CreateProductDto} from './dto/create-product.dto';
import {UpdateProductDto} from './dto/update-product.dto';
import {Product, ProductImage} from './entities';
import {PaginationDto} from 'src/common/dtos/pagination.dto';
import {validate as isUUID} from "uuid";
import { User } from 'src/auth/entities/user.entity';

@Injectable()
export class ProductsService {

    private readonly logger = new Logger(ProductsService.name);

    constructor(
        @InjectRepository(Product)
        private readonly productRepository: Repository<Product>,
        @InjectRepository(ProductImage)
        private readonly productImgRepository: Repository<ProductImage>,
        private readonly dataSource: DataSource
    ) {
    }

    async create(createProductDto: CreateProductDto, user: User) {
        try {

            const {images = [], ...productDetails} = createProductDto;

            const product = this.productRepository.create({
                ...productDetails,
                user,
                images: images.map(image => this.productImgRepository.create({
                    url: image
                }))
            });
            await this.productRepository.save(product);
            return {
                ...product,
                images
            };
        } catch (error) {
            this.handleDbExceptions(error);
        }
    }

    async findAll(paginationDto: PaginationDto) {
        const {limit = 10, offset = 0} = paginationDto;
        const products = await this.productRepository.find({
            take: limit,
            skip: offset,
            relations: {
                images: true
            }
        });
        return products.map(product => ({
            ...product,
            images: product.images.map(image => image.url)
        }));
    }

    async findOne(term: string) {
        let product: Product;

        if (isUUID(term)) {
            product = await this.productRepository.findOneBy({id: term});
        } else {
            const queryBuilder = this.productRepository.createQueryBuilder('prod');
            this.logger.log("term: " + term);
            product = await queryBuilder.where('UPPER(prod_title) =:title or prod_slug =:slug', {
                title: term.toUpperCase(),
                slug: term.toLowerCase()
            }).leftJoinAndSelect('prod.images', 'prodImages').getOne();

            this.logger.log(queryBuilder.getSql());
        }

        if (!product) throw new BadRequestException('Product not found');

        return product;
    }

    async findOnePlain(term: string) {
        const { images, ...rest} = await this.findOne(term);
        return {
            ...rest,
            images: images.map(image => image.url)
        }
    }

    async update(id: string, updateProductDto: UpdateProductDto, user: User) {

        const {images, ...toUpdate} = updateProductDto;

        const product = await this.productRepository.preload({
            id,
            ...toUpdate
        });

        if (!product) throw new NotFoundException(`Product #${id} not found`);

        //query runner
        //transaction is a series of queries that are executed together on the database

        const queryRunner = this.dataSource.createQueryRunner();

        await queryRunner.connect(); //establish connection
        await queryRunner.startTransaction();//start transaction


        try {
            
            if (images){
                await queryRunner.manager.delete(ProductImage, {product: {id}});
                product.images = images.map(image => this.productImgRepository.create({url: image}));
            }

            product.user = user;

            await queryRunner.manager.save(product);

            await queryRunner.commitTransaction();
            await queryRunner.release();

            return this.findOnePlain(id);

            //return await this.productRepository.save(product);
        } catch (e) {

            await queryRunner.rollbackTransaction();
            await queryRunner.release();

            this.handleDbExceptions(e);
        }

    }

    remove(id: string) {

        return this.productRepository.delete({id})
    }

    private handleDbExceptions(error: any) {
        if (error.code === '23505') {
            throw new BadRequestException(error.detail);
        }
        this.logger.error('Error creating product', error);
        throw new InternalServerErrorException('Unexpected error creating product, check logs');
    }


    async deleteAllProducts() {
        const query = this.productRepository.createQueryBuilder();

        try {
            return await query.delete().where({}).execute();
        }catch (error){
            this.handleDbExceptions(error);
        }

    }

}
