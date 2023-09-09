import { IsOptional, IsString, MinLength } from "class-validator";

export class NewMessageDto{
    @IsOptional()
    id?: string;
    
    @IsString()
    @MinLength(1)
    message: string;
}