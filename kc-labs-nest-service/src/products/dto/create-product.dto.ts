import { ApiProperty } from "@nestjs/swagger";
import { IsString, MinLength, IsNumber, IsPositive, 
    IsOptional, IsInt, IsArray, IsIn } from "class-validator";

export class CreateProductDto {

    @ApiProperty({
        nullable: false,
        description: 'Product title',
        minLength: 1,
    })
    @IsString()
    @MinLength(1)
    title: string;

    @ApiProperty()
    @IsNumber()
    @IsPositive()
    @IsOptional()
    price?: number;

    @ApiProperty()
    @IsString()
    @IsOptional()
    description?: string;

    @ApiProperty()
    @IsString()
    @IsOptional()
    slug?: string;

    @ApiProperty()
    @IsInt()
    @IsPositive()
    @IsOptional()
    stock?: number;

    @ApiProperty()
    @IsString({each: true})
    @IsArray()
    sizes?: string[];

    @ApiProperty()
    @IsString({each: true})
    @IsArray()
    tags: string[];

    @ApiProperty()
    @IsString({each: true})
    @IsArray()
    @IsOptional()
    images?: string[];

    @ApiProperty()
    @IsIn(['men', 'women', 'kid', 'unisex'])
    gender: string;

}
