import { SetMetadata } from '@nestjs/common';
import { Role } from 'src/types/enum';

export const Roles = (...roles: Role[]) => SetMetadata('roles', roles);
