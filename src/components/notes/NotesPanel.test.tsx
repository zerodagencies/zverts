import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { NotesPanel } from "./NotesPanel";

describe("NotesPanel", () => {
    beforeEach(() => {
        window.localStorage.clear();
    });

    it("creates, edits, searches, and deletes notes locally", async () => {
        render(<NotesPanel moduleId="module-1" />);

        fireEvent.click(screen.getByRole("button", { name: /open notes/i }));

        fireEvent.change(screen.getByPlaceholderText(/write a note/i), {
            target: { value: "First note" },
        });
        fireEvent.click(screen.getByRole("button", { name: /save note/i }));

        expect(await screen.findByText("First note")).toBeInTheDocument();

        fireEvent.click(screen.getByRole("button", { name: /edit note/i }));
        fireEvent.change(screen.getByPlaceholderText(/write a note/i), {
            target: { value: "Edited note" },
        });
        fireEvent.click(screen.getByRole("button", { name: /update note/i }));

        await waitFor(() => expect(screen.getByText("Edited note")).toBeInTheDocument());

        fireEvent.change(screen.getByPlaceholderText(/search notes/i), {
            target: { value: "Edited" },
        });

        expect(screen.getByText("Edited note")).toBeInTheDocument();

        fireEvent.click(screen.getByRole("button", { name: /delete note/i }));

        await waitFor(() => expect(screen.queryByText("Edited note")).not.toBeInTheDocument());
    });
});
