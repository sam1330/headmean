import { rolesService } from "backend/roles/roles.service";
import { META_USER_PERMISSIONS, USER_PERMISSIONS } from "shared/types/user";
import { NotFoundError } from "../../../errors";
import { entitiesService } from "../../../../entities/entities.service";
import { ValidationImplType } from "./types";

const ERROR_MESSAGE = `This resource doesn't exist or is disabled or you dont have access to it`;

export const entityValidationImpl: ValidationImplType<string> = async (req) => {
  const entity = req.query.entity as string;

  const [entityExists, isEntityDisabled] = await Promise.all([
    entitiesService.entityExist(entity),
    entitiesService.isEntityDisabled(entity),
  ]);

  if (!entityExists) {
    throw new NotFoundError(ERROR_MESSAGE);
  }

  if (isEntityDisabled) {
    if (
      !(await rolesService.canRoleDoThis(
        req.user.role,
        USER_PERMISSIONS.CAN_CONFIGURE_APP
      ))
    ) {
      throw new NotFoundError(ERROR_MESSAGE);
    }
  }

  if (
    !(await rolesService.canRoleDoThis(
      req.user.role,
      META_USER_PERMISSIONS.APPLIED_CAN_ACCESS_ENTITY(entity)
    ))
  ) {
    throw new NotFoundError(ERROR_MESSAGE);
  }

  return entity;
};
