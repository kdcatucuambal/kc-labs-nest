import {
    Entity, 
    PrimaryGeneratedColumn, 
    Column, 
    BeforeInsert, 
    BeforeUpdate, 
    OneToMany, 
    ManyToOne,
    JoinColumn} from "typeorm";
import {ProductImage} from "./product-image.entity";
import { User } from "src/auth/entities/user.entity";
import { ApiProperty } from "@nestjs/swagger";



@Entity({
    name: 'tbl_products'
})
export class Product {

    @ApiProperty({
        example: 'bbbb-aaaa-cccc-dddd',
        description: 'Unique identifier of the product.',
        uniqueItems: true
    })
    @PrimaryGeneratedColumn('uuid', {name: 'prod_id'})
    public id: string;

    @ApiProperty({
        example: 'T-shit teslo',
        description: 'Product title'
    })
    @Column('text', {name: 'prod_title', unique: true})
    public title: string;

    @ApiProperty({
        example: 'Awesome product',
        description: "Product description"
    })
    @Column('text', {name: 'prod_description', nullable: true})
    public description: string;

    @ApiProperty({
        example: 34.44,
        description: "Product price"
    })
    @Column('numeric', {name: 'prod_price', precision: 10, scale: 2})
    public price: number;

    @ApiProperty({
        example: "prod slug",
        description: "Product slug"
    })
    @Column('text', {name: 'prod_slug', unique: true})
    public slug: string;

    @ApiProperty()
    @Column('int', {name: 'prod_stock', default: 0})
    public stock: number;

    @ApiProperty()
    @Column('text', {name: 'prod_sizes', array: true, nullable: true})
    sizes: string[];

    @ApiProperty()
    @Column('text', {name: 'prod_gender'})
    public gender: string;

    @ApiProperty()
    @Column('text', {name: 'prod_tags', array: true, default: []})
    public tags: string[];

    @OneToMany(
        () => ProductImage,
        image => image.product,
        {cascade: true, eager: true})
    public images?: ProductImage[]

    @ManyToOne(
        () => User,
        user => user.product,
        {eager: false}
    )
    @JoinColumn({name: 'prod_user_id'})
    public user: User;

    @BeforeInsert()
    checkSlugInsert() {

        if (!this.slug) {
            this.slug = this.title;
        }

        this.slug = this.slug.toLowerCase()
            .replaceAll(' ', '-')
            .replaceAll("'", "")

        this.tags = this.tags.map(tag => tag.toLowerCase());
    }


    @BeforeUpdate()
    checkSlugUpdate() {
        this.slug = this.slug.toLowerCase()
            .replaceAll(' ', '-')
            .replaceAll("'", "");
        this.tags = this.tags.map(tag => tag.toLowerCase());
    }

}
