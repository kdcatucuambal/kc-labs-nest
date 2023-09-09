import { BeforeInsert, BeforeUpdate, Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Product } from '../../products/entities';


@Entity('tbl_users')
export class User {
    
    @PrimaryGeneratedColumn('uuid', {
        name: 'user_id'
    })
    id: string;

    @Column('text', {
        name: 'user_email',
        unique: true
    })
    email: string;

    @Column('text', {
        name: 'user_password',
        select: false
    })
    password: string;

    @Column('text', {
        name: 'user_full_name'
    })
    fullName: string;

    @Column('bool', {
        name: 'user_is_active',
        default: true
    })
    isActive: boolean;

    @Column('text', {
        name: 'user_roles',
        array: true,
        default: ['user']
    })
    roles: string[];

    @OneToMany(
        () => Product,
        ( product ) => product.user
    )
    product: Product[];

    @BeforeInsert()
    checkFieldsBeforeInsert() {
        this.email = this.email.toLowerCase().trim();
    }

    @BeforeUpdate()
    checkFieldsBeforeUpdate() {
        this.checkFieldsBeforeInsert();   
    }

}
