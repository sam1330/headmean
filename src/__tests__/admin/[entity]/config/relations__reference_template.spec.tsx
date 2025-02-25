import "@testing-library/jest-dom";
import React from "react";
import { render, screen, waitFor, within } from "@testing-library/react";
import { AppWrapper } from "@hadmean/chromista";
import userEvent from "@testing-library/user-event";
import EntityRelationsSettings from "pages/admin/[entity]/config/relations";

import { setupApiHandlers } from "__tests__/_/setupApihandlers";

setupApiHandlers();

describe("pages/admin/[entity]/config/relations", () => {
  beforeAll(() => {
    const useRouter = jest.spyOn(require("next/router"), "useRouter");
    useRouter.mockImplementation(() => ({
      asPath: "/",
      query: {
        entity: "entity-1",
      },
    }));
  });
  describe("Reference Template", () => {
    it("should display reference template", async () => {
      render(
        <AppWrapper>
          <EntityRelationsSettings />
        </AppWrapper>
      );
      await waitFor(() => {
        expect(screen.getByLabelText("Display Format")).toHaveValue(
          "entity-1 - {{ name }}"
        );
      });
    });

    it("should error when invalid template is provided", async () => {
      render(
        <AppWrapper>
          <EntityRelationsSettings />
        </AppWrapper>
      );

      const currentTab = screen.getByRole("tabpanel");

      await userEvent.clear(
        await within(currentTab).findByLabelText("Display Format")
      );

      await userEvent.type(
        within(currentTab).getByLabelText("Display Format"),
        "{{ this-entity-does-not-exist }}"
      );

      await userEvent.click(
        within(currentTab).getByRole("button", { name: "Update Format" })
      );

      expect(within(currentTab).getByRole("alert")).toHaveTextContent(
        "'this-entity-does-not-exist' is not a valid entity field. Valid fields are 'entity-1-id-field', 'entity-1-reference-field', 'entity-1-string-field', 'entity-1-number-field', 'entity-1-boolean-field', 'entity-1-date-field', 'entity-1-enum-field'"
      );
    });

    it("should save valid template", async () => {
      render(
        <AppWrapper>
          <EntityRelationsSettings />
        </AppWrapper>
      );

      const currentTab = screen.getByRole("tabpanel");

      await userEvent.clear(
        await within(currentTab).findByLabelText("Display Format")
      );

      await userEvent.type(
        within(currentTab).getByLabelText("Display Format"),
        "{{{{ entity-1-id-field }} - {{{{ entity-1-string-field }} hello"
      );

      await userEvent.click(
        within(currentTab).getByRole("button", { name: "Update Format" })
      );
      expect(await screen.findByRole("status")).toHaveTextContent(
        "App Settings Saved Successfully"
      );
    });

    it("should display saved template", async () => {
      render(
        <AppWrapper>
          <EntityRelationsSettings />
        </AppWrapper>
      );
      await waitFor(() => {
        expect(screen.getByLabelText("Display Format")).toHaveValue(
          "{{ entity-1-id-field }} - {{ entity-1-string-field }} hello"
        );
      });
    });
  });
});
