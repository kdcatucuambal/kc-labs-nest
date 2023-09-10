import {Column, Entity, ManyToOne, PrimaryGeneratedColumn} from "typeorm";
import {Product} from "./product.entity";



@Entity({
    name: 'tbl_product_images'
})
export class ProductImage{

    @PrimaryGeneratedColumn()
    public id: number;

    @Column('text', {name: 'img_url'})
    public url: string;

    @ManyToOne(
        () => Product,
        product => product.images,
        {onDelete: 'CASCADE'}
    )
    public product: Product;

}