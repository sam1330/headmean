import { configurationService } from "backend/configuration/configuration.service";
import {
  credentialsService,
  environmentVariablesService,
  appConstantsService,
} from "backend/integrations-configurations";
import { dataService } from "backend/data/data.service";
import { entitiesService } from "backend/entities/entities.service";
import { configService } from "backend/lib/config/config.service";
import { rolesService } from "backend/roles/roles.service";
import { schemasService } from "backend/schema/schema.service";
import { usersService } from "backend/users/users.service";
import noop from "lodash/noop";
import { packagesService } from "backend/packages/packages.service";
import { requestHandler } from "backend/lib/request";
import { storageService } from "backend/storage/storage.service";
import { actionsService } from "backend/actions/actions.service";
import { dashboardWidgetsService } from "backend/dashboard-widgets/dashboard-widgets.service";
import { listOrderService } from "backend/list-order/list-order.service";
import { bootstrapPortalServices } from "./portal";

export default requestHandler(
  {
    GET: async () => {
      try {
        configService.bootstrap();

        await credentialsService.bootstrap();
        await configurationService.bootstrap();
        await environmentVariablesService.bootstrap();
        await appConstantsService.bootstrap();
        await rolesService.bootstrap();

        await dataService.bootstrap();
        await schemasService.bootstrap();
        await usersService.bootstrap();
        await entitiesService.bootstrap();
        await actionsService.bootstrap();
        await dashboardWidgetsService.bootstrap();
        await storageService.bootstrap();
        await listOrderService.bootstrap();

        await packagesService.bootstrap();

        await bootstrapPortalServices();

        await packagesService.installPackages();
      } catch (error) {
        noop();
      }
      return {
        ok: true,
      };
    },
  },
  [
    {
      _type: "anyBody",
    },
  ]
);
