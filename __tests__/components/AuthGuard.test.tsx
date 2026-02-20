/**
 * AuthGuard / AdminGuard component tests.
 */
import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { AuthGuard } from "@/components/AuthGuard";

// Mock next/navigation
const mockReplace = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({ replace: mockReplace }),
}));

// Mock useAuthStore
const mockHydrate = jest.fn();
let mockAuthState = { isAuth: false, isLoading: true, hydrate: mockHydrate };

jest.mock("@/lib/store", () => ({
  useAuthStore: () => mockAuthState,
}));

beforeEach(() => {
  jest.clearAllMocks();
  mockAuthState = { isAuth: false, isLoading: true, hydrate: mockHydrate };
});

describe("AuthGuard", () => {
  it("shows spinner while loading", () => {
    mockAuthState = { isAuth: false, isLoading: true, hydrate: mockHydrate };
    const { container } = render(
      <AuthGuard>
        <div data-testid="protected">Secret Content</div>
      </AuthGuard>
    );
    expect(screen.queryByTestId("protected")).not.toBeInTheDocument();
    expect(container.querySelector(".animate-spin")).toBeInTheDocument();
    expect(mockHydrate).toHaveBeenCalled();
  });

  it("redirects to /login when not authenticated", async () => {
    mockAuthState = { isAuth: false, isLoading: false, hydrate: mockHydrate };
    render(
      <AuthGuard>
        <div data-testid="protected">Secret Content</div>
      </AuthGuard>
    );
    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith("/login");
    });
    expect(screen.queryByTestId("protected")).not.toBeInTheDocument();
  });

  it("renders children when authenticated", () => {
    mockAuthState = { isAuth: true, isLoading: false, hydrate: mockHydrate };
    render(
      <AuthGuard>
        <div data-testid="protected">Secret Content</div>
      </AuthGuard>
    );
    expect(screen.getByTestId("protected")).toBeInTheDocument();
    expect(screen.getByText("Secret Content")).toBeInTheDocument();
    expect(mockReplace).not.toHaveBeenCalled();
  });
});
