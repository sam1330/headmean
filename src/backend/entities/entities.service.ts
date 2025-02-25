import { IValueLabel } from "@hadmean/chromista/dist/types";
import {
  configurationService,
  ConfigurationService,
} from "backend/configuration/configuration.service";
import { rolesService, RolesService } from "backend/roles/roles.service";
import { IApplicationService } from "backend/types";
import noop from "lodash/noop";
import { IDBSchema, IEntityField, IEntityRelation } from "shared/types/db";
import { SchemasService, schemasService } from "../schema/schema.service";
import { sortByList } from "./utils";

export class EntitiesService implements IApplicationService {
  constructor(
    private _schemasService: SchemasService,
    private _configurationService: ConfigurationService,
    private _rolesService: RolesService
  ) {}

  async bootstrap() {
    noop();
  }

  private async getDBSchemaModels(): Promise<Record<string, IDBSchema>> {
    return Object.fromEntries(
      (await this._schemasService.getDBSchema()).map((model) => [
        model.name,
        model,
      ])
    );
  }

  async getActiveEntities(): Promise<IValueLabel[]> {
    const [hiddenEntities, entitiesOrder, entities] = await Promise.all([
      this._configurationService.show<string[]>("disabled_entities"),
      this._configurationService.show<string[]>("entities_order"),
      this.getAllEntities(),
    ]);
    const activeEntities = entities.filter(
      ({ value }) => !hiddenEntities.includes(value)
    );

    sortByList(
      activeEntities.sort((a, b) => a.value.localeCompare(b.value)),
      entitiesOrder,
      "value"
    );

    return activeEntities;
  }

  async getEntityFields(entity: string): Promise<IEntityField[]> {
    return (await this.getEntityFromSchema(entity)).fields;
  }

  async getOrderedEntityFields(entity: string) {
    const [entityFields, entityFieldsOrder] = await Promise.all([
      this.getEntityFields(entity),
      this._configurationService.show<string[]>("entity_fields_orders", entity),
    ]);

    sortByList(
      entityFields as unknown as Record<string, unknown>[],
      entityFieldsOrder,
      "name" as keyof IEntityField
    );

    return entityFields;
  }

  async getEntityFirstFieldType(
    entity: string,
    fieldType: IEntityField["type"]
  ): Promise<string | undefined> {
    const allFields = await this.getEntityFields(entity);
    return allFields.find(({ type }) => {
      return type === fieldType;
    })?.name;
  }

  async getEntityRelations(entity: string): Promise<IDBSchema["relations"]> {
    return (await this.getEntityFromSchema(entity)).relations;
  }

  async getEntityPrimaryField(entity: string): Promise<string> {
    return (
      (await this.getEntityFields(entity)).find(({ isId }) => isId)?.name ||
      "id"
    );
  }

  async getEntityFromSchema(entity: string): Promise<IDBSchema> {
    return (await this.getDBSchemaModels())[entity];
  }

  async entityExist(entity: string): Promise<boolean> {
    return !!(await this.getDBSchemaModels())[entity];
  }

  async isEntityDisabled(entity: string): Promise<boolean> {
    return (
      await this._configurationService.show<string[]>("disabled_entities")
    ).includes(entity);
  }

  async getAllEntities(): Promise<{ value: string; label: string }[]> {
    return (await this._schemasService.getDBSchema()).map(({ name }) => ({
      value: name,
      label: name,
    }));
  }

  async getEntityRelationsForUserRole(
    entity: string,
    userRole: string
  ): Promise<IEntityRelation[]> {
    const [
      entityRelations,
      disabledEntities,
      entityLabels,
      entityOrders,
      hiddenEntity,
    ] = await Promise.all([
      this.getEntityRelations(entity),
      this._configurationService.show<string[]>("disabled_entities"),
      this._configurationService.show<Record<string, string>>(
        "entity_relations_labels",
        entity
      ),
      this._configurationService.show<string[]>(
        "entity_relations_order",
        entity
      ),
      this._configurationService.show<string[]>(
        "hidden_entity_relations",
        entity
      ),
    ]);

    const allowedEntityRelation =
      await this._rolesService.filterPermittedEntities(
        userRole,
        entityRelations.filter(
          ({ table }) =>
            !disabledEntities.includes(table) && !hiddenEntity.includes(table)
        ),
        "table"
      );

    sortByList(
      allowedEntityRelation as unknown[] as Record<string, unknown>[],
      entityOrders,
      "table"
    );

    return allowedEntityRelation.map((relation) => {
      const type = relation?.joinColumnOptions?.[0].name ? "toOne" : "toMany";

      return {
        table: relation.table,
        label: entityLabels[relation.table],
        type,
        field:
          type === "toOne" ? relation?.joinColumnOptions?.[0].name : undefined,
      };
    });
  }
}

export const entitiesService = new EntitiesService(
  schemasService,
  configurationService,
  rolesService
);
