import { AppStorage, useApiQueries } from "@hadmean/protozoa";
import { useCallback } from "react";
import { userFriendlyCase } from "shared/lib/strings";
import { configurationApiPath } from "../configuration/configuration.store";

export function useEntityDictionPlurals<T, P extends keyof T>(
  input: T[],
  field: P
) {
  const entityDictions = useApiQueries<T, { singular: string; plural: string }>(
    {
      input,
      accessor: field,
      pathFn: (entity) =>
        configurationApiPath("entity_diction", entity as unknown as string),
      placeholderDataFn: (entity) =>
        AppStorage.get(
          configurationApiPath("entity_diction", entity as unknown as string)
        ),
    }
  );

  return useCallback(
    (fieldName: string): string =>
      entityDictions.data[fieldName]?.data?.plural ||
      userFriendlyCase(fieldName),
    [entityDictions.data]
  );
}
