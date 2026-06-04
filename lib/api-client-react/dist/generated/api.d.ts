import type { QueryKey, UseMutationOptions, UseMutationResult, UseQueryOptions, UseQueryResult } from "@tanstack/react-query";
import type { AuthResult, Category, CompleteSetupBody, Contact, ContactListResponse, ContactSubmitBody, CreateCategoryBody, CreateEntryBody, CreateUserBody, DirectorySettings, Entry, EntryListResponse, ErrorResponse, HealthStatus, ImportAnalyzeBody, ImportAnalyzeResult, ImportCsvBody, ImportJob, ListEntriesParams, ListPublicEntriesParams, LoginBody, PublicStats, RequestUploadUrlBody, RequestUploadUrlResponse, SetupResult, SetupStatus, SuccessResponse, TogglePublishBody, UpdateCategoryBody, UpdateEntryBody, UpdateSettingsBody, UpdateUserBody, User } from "./api.schemas";
import { customFetch } from "../custom-fetch";
import type { ErrorType, BodyType } from "../custom-fetch";
type AwaitedInput<T> = PromiseLike<T> | T;
type Awaited<O> = O extends AwaitedInput<infer T> ? T : never;
type SecondParameter<T extends (...args: never) => unknown> = Parameters<T>[1];
/**
 * @summary Submit a claim listing form
 */
export declare const getCreateContactUrl: () => string;
export declare const createContact: (contactSubmitBody: ContactSubmitBody, options?: RequestInit) => Promise<Contact>;
export declare const getCreateContactMutationOptions: <TError = ErrorType<ErrorResponse>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof createContact>>, TError, {
        data: BodyType<ContactSubmitBody>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof createContact>>, TError, {
    data: BodyType<ContactSubmitBody>;
}, TContext>;
export type CreateContactMutationResult = NonNullable<Awaited<ReturnType<typeof createContact>>>;
export type CreateContactMutationBody = BodyType<ContactSubmitBody>;
export type CreateContactMutationError = ErrorType<ErrorResponse>;
/**
 * @summary Submit a claim listing form
 */
export declare const useCreateContact: <TError = ErrorType<ErrorResponse>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof createContact>>, TError, {
        data: BodyType<ContactSubmitBody>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof createContact>>, TError, {
    data: BodyType<ContactSubmitBody>;
}, TContext>;
/**
 * @summary List all contact submissions (admin)
 */
export declare const getListContactsUrl: () => string;
export declare const listContacts: (options?: RequestInit) => Promise<ContactListResponse>;
export declare const getListContactsQueryKey: () => readonly ["/api/contacts"];
export declare const getListContactsQueryOptions: <TData = Awaited<ReturnType<typeof listContacts>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listContacts>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof listContacts>>, TError, TData> & {
    queryKey: QueryKey;
};
export type ListContactsQueryResult = NonNullable<Awaited<ReturnType<typeof listContacts>>>;
export type ListContactsQueryError = ErrorType<unknown>;
/**
 * @summary List all contact submissions (admin)
 */
export declare function useListContacts<TData = Awaited<ReturnType<typeof listContacts>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listContacts>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
/**
 * @summary Delete a contact submission (admin)
 */
export declare const getDeleteContactUrl: (id: number) => string;
export declare const deleteContact: (id: number, options?: RequestInit) => Promise<SuccessResponse>;
export declare const getDeleteContactMutationOptions: <TError = ErrorType<ErrorResponse>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof deleteContact>>, TError, {
        id: number;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof deleteContact>>, TError, {
    id: number;
}, TContext>;
export type DeleteContactMutationResult = NonNullable<Awaited<ReturnType<typeof deleteContact>>>;
export type DeleteContactMutationError = ErrorType<ErrorResponse>;
/**
 * @summary Delete a contact submission (admin)
 */
export declare const useDeleteContact: <TError = ErrorType<ErrorResponse>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof deleteContact>>, TError, {
        id: number;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof deleteContact>>, TError, {
    id: number;
}, TContext>;
/**
 * @summary Request a presigned upload URL
 */
export declare const getRequestUploadUrlUrl: () => string;
export declare const requestUploadUrl: (requestUploadUrlBody: RequestUploadUrlBody, options?: RequestInit) => Promise<RequestUploadUrlResponse>;
export declare const getRequestUploadUrlMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof requestUploadUrl>>, TError, {
        data: BodyType<RequestUploadUrlBody>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof requestUploadUrl>>, TError, {
    data: BodyType<RequestUploadUrlBody>;
}, TContext>;
export type RequestUploadUrlMutationResult = NonNullable<Awaited<ReturnType<typeof requestUploadUrl>>>;
export type RequestUploadUrlMutationBody = BodyType<RequestUploadUrlBody>;
export type RequestUploadUrlMutationError = ErrorType<unknown>;
/**
 * @summary Request a presigned upload URL
 */
export declare const useRequestUploadUrl: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof requestUploadUrl>>, TError, {
        data: BodyType<RequestUploadUrlBody>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof requestUploadUrl>>, TError, {
    data: BodyType<RequestUploadUrlBody>;
}, TContext>;
/**
 * @summary Serve a stored object
 */
export declare const getGetStorageObjectUrl: (objectPath: string) => string;
export declare const getStorageObject: (objectPath: string, options?: RequestInit) => Promise<Blob>;
export declare const getGetStorageObjectQueryKey: (objectPath: string) => readonly [`/api/storage/objects/${string}`];
export declare const getGetStorageObjectQueryOptions: <TData = Awaited<ReturnType<typeof getStorageObject>>, TError = ErrorType<unknown>>(objectPath: string, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getStorageObject>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getStorageObject>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetStorageObjectQueryResult = NonNullable<Awaited<ReturnType<typeof getStorageObject>>>;
export type GetStorageObjectQueryError = ErrorType<unknown>;
/**
 * @summary Serve a stored object
 */
export declare function useGetStorageObject<TData = Awaited<ReturnType<typeof getStorageObject>>, TError = ErrorType<unknown>>(objectPath: string, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getStorageObject>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
/**
 * @summary Health check
 */
export declare const getHealthCheckUrl: () => string;
export declare const healthCheck: (options?: RequestInit) => Promise<HealthStatus>;
export declare const getHealthCheckQueryKey: () => readonly ["/api/healthz"];
export declare const getHealthCheckQueryOptions: <TData = Awaited<ReturnType<typeof healthCheck>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof healthCheck>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof healthCheck>>, TError, TData> & {
    queryKey: QueryKey;
};
export type HealthCheckQueryResult = NonNullable<Awaited<ReturnType<typeof healthCheck>>>;
export type HealthCheckQueryError = ErrorType<unknown>;
/**
 * @summary Health check
 */
export declare function useHealthCheck<TData = Awaited<ReturnType<typeof healthCheck>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof healthCheck>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
/**
 * @summary Get installation status
 */
export declare const getGetSetupStatusUrl: () => string;
export declare const getSetupStatus: (options?: RequestInit) => Promise<SetupStatus>;
export declare const getGetSetupStatusQueryKey: () => readonly ["/api/setup/status"];
export declare const getGetSetupStatusQueryOptions: <TData = Awaited<ReturnType<typeof getSetupStatus>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getSetupStatus>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getSetupStatus>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetSetupStatusQueryResult = NonNullable<Awaited<ReturnType<typeof getSetupStatus>>>;
export type GetSetupStatusQueryError = ErrorType<unknown>;
/**
 * @summary Get installation status
 */
export declare function useGetSetupStatus<TData = Awaited<ReturnType<typeof getSetupStatus>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getSetupStatus>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
/**
 * @summary Complete setup wizard
 */
export declare const getCompleteSetupUrl: () => string;
export declare const completeSetup: (completeSetupBody: CompleteSetupBody, options?: RequestInit) => Promise<SetupResult>;
export declare const getCompleteSetupMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof completeSetup>>, TError, {
        data: BodyType<CompleteSetupBody>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof completeSetup>>, TError, {
    data: BodyType<CompleteSetupBody>;
}, TContext>;
export type CompleteSetupMutationResult = NonNullable<Awaited<ReturnType<typeof completeSetup>>>;
export type CompleteSetupMutationBody = BodyType<CompleteSetupBody>;
export type CompleteSetupMutationError = ErrorType<unknown>;
/**
 * @summary Complete setup wizard
 */
export declare const useCompleteSetup: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof completeSetup>>, TError, {
        data: BodyType<CompleteSetupBody>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof completeSetup>>, TError, {
    data: BodyType<CompleteSetupBody>;
}, TContext>;
/**
 * @summary Login with email and password
 */
export declare const getLoginUrl: () => string;
export declare const login: (loginBody: LoginBody, options?: RequestInit) => Promise<AuthResult>;
export declare const getLoginMutationOptions: <TError = ErrorType<ErrorResponse>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof login>>, TError, {
        data: BodyType<LoginBody>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof login>>, TError, {
    data: BodyType<LoginBody>;
}, TContext>;
export type LoginMutationResult = NonNullable<Awaited<ReturnType<typeof login>>>;
export type LoginMutationBody = BodyType<LoginBody>;
export type LoginMutationError = ErrorType<ErrorResponse>;
/**
 * @summary Login with email and password
 */
export declare const useLogin: <TError = ErrorType<ErrorResponse>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof login>>, TError, {
        data: BodyType<LoginBody>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof login>>, TError, {
    data: BodyType<LoginBody>;
}, TContext>;
/**
 * @summary Logout current session
 */
export declare const getLogoutUrl: () => string;
export declare const logout: (options?: RequestInit) => Promise<SuccessResponse>;
export declare const getLogoutMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof logout>>, TError, void, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof logout>>, TError, void, TContext>;
export type LogoutMutationResult = NonNullable<Awaited<ReturnType<typeof logout>>>;
export type LogoutMutationError = ErrorType<unknown>;
/**
 * @summary Logout current session
 */
export declare const useLogout: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof logout>>, TError, void, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof logout>>, TError, void, TContext>;
/**
 * @summary Get current authenticated user
 */
export declare const getGetCurrentUserUrl: () => string;
export declare const getCurrentUser: (options?: RequestInit) => Promise<User>;
export declare const getGetCurrentUserQueryKey: () => readonly ["/api/auth/me"];
export declare const getGetCurrentUserQueryOptions: <TData = Awaited<ReturnType<typeof getCurrentUser>>, TError = ErrorType<ErrorResponse>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getCurrentUser>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getCurrentUser>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetCurrentUserQueryResult = NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>;
export type GetCurrentUserQueryError = ErrorType<ErrorResponse>;
/**
 * @summary Get current authenticated user
 */
export declare function useGetCurrentUser<TData = Awaited<ReturnType<typeof getCurrentUser>>, TError = ErrorType<ErrorResponse>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getCurrentUser>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
/**
 * @summary List all entries (admin)
 */
export declare const getListEntriesUrl: (params?: ListEntriesParams) => string;
export declare const listEntries: (params?: ListEntriesParams, options?: RequestInit) => Promise<EntryListResponse>;
export declare const getListEntriesQueryKey: (params?: ListEntriesParams) => readonly ["/api/entries", ...ListEntriesParams[]];
export declare const getListEntriesQueryOptions: <TData = Awaited<ReturnType<typeof listEntries>>, TError = ErrorType<unknown>>(params?: ListEntriesParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listEntries>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof listEntries>>, TError, TData> & {
    queryKey: QueryKey;
};
export type ListEntriesQueryResult = NonNullable<Awaited<ReturnType<typeof listEntries>>>;
export type ListEntriesQueryError = ErrorType<unknown>;
/**
 * @summary List all entries (admin)
 */
export declare function useListEntries<TData = Awaited<ReturnType<typeof listEntries>>, TError = ErrorType<unknown>>(params?: ListEntriesParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listEntries>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
/**
 * @summary Create a new entry
 */
export declare const getCreateEntryUrl: () => string;
export declare const createEntry: (createEntryBody: CreateEntryBody, options?: RequestInit) => Promise<Entry>;
export declare const getCreateEntryMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof createEntry>>, TError, {
        data: BodyType<CreateEntryBody>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof createEntry>>, TError, {
    data: BodyType<CreateEntryBody>;
}, TContext>;
export type CreateEntryMutationResult = NonNullable<Awaited<ReturnType<typeof createEntry>>>;
export type CreateEntryMutationBody = BodyType<CreateEntryBody>;
export type CreateEntryMutationError = ErrorType<unknown>;
/**
 * @summary Create a new entry
 */
export declare const useCreateEntry: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof createEntry>>, TError, {
        data: BodyType<CreateEntryBody>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof createEntry>>, TError, {
    data: BodyType<CreateEntryBody>;
}, TContext>;
/**
 * @summary Get a single entry
 */
export declare const getGetEntryUrl: (id: number) => string;
export declare const getEntry: (id: number, options?: RequestInit) => Promise<Entry>;
export declare const getGetEntryQueryKey: (id: number) => readonly [`/api/entries/${number}`];
export declare const getGetEntryQueryOptions: <TData = Awaited<ReturnType<typeof getEntry>>, TError = ErrorType<ErrorResponse>>(id: number, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getEntry>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getEntry>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetEntryQueryResult = NonNullable<Awaited<ReturnType<typeof getEntry>>>;
export type GetEntryQueryError = ErrorType<ErrorResponse>;
/**
 * @summary Get a single entry
 */
export declare function useGetEntry<TData = Awaited<ReturnType<typeof getEntry>>, TError = ErrorType<ErrorResponse>>(id: number, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getEntry>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
/**
 * @summary Update an entry
 */
export declare const getUpdateEntryUrl: (id: number) => string;
export declare const updateEntry: (id: number, updateEntryBody: UpdateEntryBody, options?: RequestInit) => Promise<Entry>;
export declare const getUpdateEntryMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof updateEntry>>, TError, {
        id: number;
        data: BodyType<UpdateEntryBody>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof updateEntry>>, TError, {
    id: number;
    data: BodyType<UpdateEntryBody>;
}, TContext>;
export type UpdateEntryMutationResult = NonNullable<Awaited<ReturnType<typeof updateEntry>>>;
export type UpdateEntryMutationBody = BodyType<UpdateEntryBody>;
export type UpdateEntryMutationError = ErrorType<unknown>;
/**
 * @summary Update an entry
 */
export declare const useUpdateEntry: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof updateEntry>>, TError, {
        id: number;
        data: BodyType<UpdateEntryBody>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof updateEntry>>, TError, {
    id: number;
    data: BodyType<UpdateEntryBody>;
}, TContext>;
/**
 * @summary Delete an entry
 */
export declare const getDeleteEntryUrl: (id: number) => string;
export declare const deleteEntry: (id: number, options?: RequestInit) => Promise<SuccessResponse>;
export declare const getDeleteEntryMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof deleteEntry>>, TError, {
        id: number;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof deleteEntry>>, TError, {
    id: number;
}, TContext>;
export type DeleteEntryMutationResult = NonNullable<Awaited<ReturnType<typeof deleteEntry>>>;
export type DeleteEntryMutationError = ErrorType<unknown>;
/**
 * @summary Delete an entry
 */
export declare const useDeleteEntry: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof deleteEntry>>, TError, {
        id: number;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof deleteEntry>>, TError, {
    id: number;
}, TContext>;
/**
 * @summary Toggle entry published status
 */
export declare const getToggleEntryPublishedUrl: (id: number) => string;
export declare const toggleEntryPublished: (id: number, togglePublishBody: TogglePublishBody, options?: RequestInit) => Promise<Entry>;
export declare const getToggleEntryPublishedMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof toggleEntryPublished>>, TError, {
        id: number;
        data: BodyType<TogglePublishBody>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof toggleEntryPublished>>, TError, {
    id: number;
    data: BodyType<TogglePublishBody>;
}, TContext>;
export type ToggleEntryPublishedMutationResult = NonNullable<Awaited<ReturnType<typeof toggleEntryPublished>>>;
export type ToggleEntryPublishedMutationBody = BodyType<TogglePublishBody>;
export type ToggleEntryPublishedMutationError = ErrorType<unknown>;
/**
 * @summary Toggle entry published status
 */
export declare const useToggleEntryPublished: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof toggleEntryPublished>>, TError, {
        id: number;
        data: BodyType<TogglePublishBody>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof toggleEntryPublished>>, TError, {
    id: number;
    data: BodyType<TogglePublishBody>;
}, TContext>;
/**
 * @summary List all categories
 */
export declare const getListCategoriesUrl: () => string;
export declare const listCategories: (options?: RequestInit) => Promise<Category[]>;
export declare const getListCategoriesQueryKey: () => readonly ["/api/categories"];
export declare const getListCategoriesQueryOptions: <TData = Awaited<ReturnType<typeof listCategories>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listCategories>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof listCategories>>, TError, TData> & {
    queryKey: QueryKey;
};
export type ListCategoriesQueryResult = NonNullable<Awaited<ReturnType<typeof listCategories>>>;
export type ListCategoriesQueryError = ErrorType<unknown>;
/**
 * @summary List all categories
 */
export declare function useListCategories<TData = Awaited<ReturnType<typeof listCategories>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listCategories>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
/**
 * @summary Create a category
 */
export declare const getCreateCategoryUrl: () => string;
export declare const createCategory: (createCategoryBody: CreateCategoryBody, options?: RequestInit) => Promise<Category>;
export declare const getCreateCategoryMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof createCategory>>, TError, {
        data: BodyType<CreateCategoryBody>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof createCategory>>, TError, {
    data: BodyType<CreateCategoryBody>;
}, TContext>;
export type CreateCategoryMutationResult = NonNullable<Awaited<ReturnType<typeof createCategory>>>;
export type CreateCategoryMutationBody = BodyType<CreateCategoryBody>;
export type CreateCategoryMutationError = ErrorType<unknown>;
/**
 * @summary Create a category
 */
export declare const useCreateCategory: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof createCategory>>, TError, {
        data: BodyType<CreateCategoryBody>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof createCategory>>, TError, {
    data: BodyType<CreateCategoryBody>;
}, TContext>;
/**
 * @summary Update a category
 */
export declare const getUpdateCategoryUrl: (id: number) => string;
export declare const updateCategory: (id: number, updateCategoryBody: UpdateCategoryBody, options?: RequestInit) => Promise<Category>;
export declare const getUpdateCategoryMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof updateCategory>>, TError, {
        id: number;
        data: BodyType<UpdateCategoryBody>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof updateCategory>>, TError, {
    id: number;
    data: BodyType<UpdateCategoryBody>;
}, TContext>;
export type UpdateCategoryMutationResult = NonNullable<Awaited<ReturnType<typeof updateCategory>>>;
export type UpdateCategoryMutationBody = BodyType<UpdateCategoryBody>;
export type UpdateCategoryMutationError = ErrorType<unknown>;
/**
 * @summary Update a category
 */
export declare const useUpdateCategory: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof updateCategory>>, TError, {
        id: number;
        data: BodyType<UpdateCategoryBody>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof updateCategory>>, TError, {
    id: number;
    data: BodyType<UpdateCategoryBody>;
}, TContext>;
/**
 * @summary Delete a category
 */
export declare const getDeleteCategoryUrl: (id: number) => string;
export declare const deleteCategory: (id: number, options?: RequestInit) => Promise<SuccessResponse>;
export declare const getDeleteCategoryMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof deleteCategory>>, TError, {
        id: number;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof deleteCategory>>, TError, {
    id: number;
}, TContext>;
export type DeleteCategoryMutationResult = NonNullable<Awaited<ReturnType<typeof deleteCategory>>>;
export type DeleteCategoryMutationError = ErrorType<unknown>;
/**
 * @summary Delete a category
 */
export declare const useDeleteCategory: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof deleteCategory>>, TError, {
        id: number;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof deleteCategory>>, TError, {
    id: number;
}, TContext>;
/**
 * @summary Get directory settings
 */
export declare const getGetSettingsUrl: () => string;
export declare const getSettings: (options?: RequestInit) => Promise<DirectorySettings>;
export declare const getGetSettingsQueryKey: () => readonly ["/api/settings"];
export declare const getGetSettingsQueryOptions: <TData = Awaited<ReturnType<typeof getSettings>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getSettings>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getSettings>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetSettingsQueryResult = NonNullable<Awaited<ReturnType<typeof getSettings>>>;
export type GetSettingsQueryError = ErrorType<unknown>;
/**
 * @summary Get directory settings
 */
export declare function useGetSettings<TData = Awaited<ReturnType<typeof getSettings>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getSettings>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
/**
 * @summary Update directory settings
 */
export declare const getUpdateSettingsUrl: () => string;
export declare const updateSettings: (updateSettingsBody: UpdateSettingsBody, options?: RequestInit) => Promise<DirectorySettings>;
export declare const getUpdateSettingsMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof updateSettings>>, TError, {
        data: BodyType<UpdateSettingsBody>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof updateSettings>>, TError, {
    data: BodyType<UpdateSettingsBody>;
}, TContext>;
export type UpdateSettingsMutationResult = NonNullable<Awaited<ReturnType<typeof updateSettings>>>;
export type UpdateSettingsMutationBody = BodyType<UpdateSettingsBody>;
export type UpdateSettingsMutationError = ErrorType<unknown>;
/**
 * @summary Update directory settings
 */
export declare const useUpdateSettings: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof updateSettings>>, TError, {
        data: BodyType<UpdateSettingsBody>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof updateSettings>>, TError, {
    data: BodyType<UpdateSettingsBody>;
}, TContext>;
/**
 * @summary List all users
 */
export declare const getListUsersUrl: () => string;
export declare const listUsers: (options?: RequestInit) => Promise<User[]>;
export declare const getListUsersQueryKey: () => readonly ["/api/users"];
export declare const getListUsersQueryOptions: <TData = Awaited<ReturnType<typeof listUsers>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listUsers>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof listUsers>>, TError, TData> & {
    queryKey: QueryKey;
};
export type ListUsersQueryResult = NonNullable<Awaited<ReturnType<typeof listUsers>>>;
export type ListUsersQueryError = ErrorType<unknown>;
/**
 * @summary List all users
 */
export declare function useListUsers<TData = Awaited<ReturnType<typeof listUsers>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listUsers>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
/**
 * @summary Create a user
 */
export declare const getCreateUserUrl: () => string;
export declare const createUser: (createUserBody: CreateUserBody, options?: RequestInit) => Promise<User>;
export declare const getCreateUserMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof createUser>>, TError, {
        data: BodyType<CreateUserBody>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof createUser>>, TError, {
    data: BodyType<CreateUserBody>;
}, TContext>;
export type CreateUserMutationResult = NonNullable<Awaited<ReturnType<typeof createUser>>>;
export type CreateUserMutationBody = BodyType<CreateUserBody>;
export type CreateUserMutationError = ErrorType<unknown>;
/**
 * @summary Create a user
 */
export declare const useCreateUser: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof createUser>>, TError, {
        data: BodyType<CreateUserBody>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof createUser>>, TError, {
    data: BodyType<CreateUserBody>;
}, TContext>;
/**
 * @summary Update a user
 */
export declare const getUpdateUserUrl: (id: number) => string;
export declare const updateUser: (id: number, updateUserBody: UpdateUserBody, options?: RequestInit) => Promise<User>;
export declare const getUpdateUserMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof updateUser>>, TError, {
        id: number;
        data: BodyType<UpdateUserBody>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof updateUser>>, TError, {
    id: number;
    data: BodyType<UpdateUserBody>;
}, TContext>;
export type UpdateUserMutationResult = NonNullable<Awaited<ReturnType<typeof updateUser>>>;
export type UpdateUserMutationBody = BodyType<UpdateUserBody>;
export type UpdateUserMutationError = ErrorType<unknown>;
/**
 * @summary Update a user
 */
export declare const useUpdateUser: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof updateUser>>, TError, {
        id: number;
        data: BodyType<UpdateUserBody>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof updateUser>>, TError, {
    id: number;
    data: BodyType<UpdateUserBody>;
}, TContext>;
/**
 * @summary Delete a user
 */
export declare const getDeleteUserUrl: (id: number) => string;
export declare const deleteUser: (id: number, options?: RequestInit) => Promise<SuccessResponse>;
export declare const getDeleteUserMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof deleteUser>>, TError, {
        id: number;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof deleteUser>>, TError, {
    id: number;
}, TContext>;
export type DeleteUserMutationResult = NonNullable<Awaited<ReturnType<typeof deleteUser>>>;
export type DeleteUserMutationError = ErrorType<unknown>;
/**
 * @summary Delete a user
 */
export declare const useDeleteUser: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof deleteUser>>, TError, {
        id: number;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof deleteUser>>, TError, {
    id: number;
}, TContext>;
/**
 * @summary Analyze CSV headers and suggest field mappings
 */
export declare const getAnalyzeImportUrl: () => string;
export declare const analyzeImport: (importAnalyzeBody: ImportAnalyzeBody, options?: RequestInit) => Promise<ImportAnalyzeResult>;
export declare const getAnalyzeImportMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof analyzeImport>>, TError, {
        data: BodyType<ImportAnalyzeBody>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof analyzeImport>>, TError, {
    data: BodyType<ImportAnalyzeBody>;
}, TContext>;
export type AnalyzeImportMutationResult = NonNullable<Awaited<ReturnType<typeof analyzeImport>>>;
export type AnalyzeImportMutationBody = BodyType<ImportAnalyzeBody>;
export type AnalyzeImportMutationError = ErrorType<unknown>;
/**
 * @summary Analyze CSV headers and suggest field mappings
 */
export declare const useAnalyzeImport: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof analyzeImport>>, TError, {
        data: BodyType<ImportAnalyzeBody>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof analyzeImport>>, TError, {
    data: BodyType<ImportAnalyzeBody>;
}, TContext>;
/**
 * @summary Import entries from CSV text with confirmed field mappings
 */
export declare const getImportCsvUrl: () => string;
export declare const importCsv: (importCsvBody: ImportCsvBody, options?: RequestInit) => Promise<ImportJob>;
export declare const getImportCsvMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof importCsv>>, TError, {
        data: BodyType<ImportCsvBody>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof importCsv>>, TError, {
    data: BodyType<ImportCsvBody>;
}, TContext>;
export type ImportCsvMutationResult = NonNullable<Awaited<ReturnType<typeof importCsv>>>;
export type ImportCsvMutationBody = BodyType<ImportCsvBody>;
export type ImportCsvMutationError = ErrorType<unknown>;
/**
 * @summary Import entries from CSV text with confirmed field mappings
 */
export declare const useImportCsv: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof importCsv>>, TError, {
        data: BodyType<ImportCsvBody>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof importCsv>>, TError, {
    data: BodyType<ImportCsvBody>;
}, TContext>;
/**
 * @summary Get import job status
 */
export declare const getGetImportStatusUrl: (jobId: string) => string;
export declare const getImportStatus: (jobId: string, options?: RequestInit) => Promise<ImportJob>;
export declare const getGetImportStatusQueryKey: (jobId: string) => readonly [`/api/import/status/${string}`];
export declare const getGetImportStatusQueryOptions: <TData = Awaited<ReturnType<typeof getImportStatus>>, TError = ErrorType<unknown>>(jobId: string, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getImportStatus>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getImportStatus>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetImportStatusQueryResult = NonNullable<Awaited<ReturnType<typeof getImportStatus>>>;
export type GetImportStatusQueryError = ErrorType<unknown>;
/**
 * @summary Get import job status
 */
export declare function useGetImportStatus<TData = Awaited<ReturnType<typeof getImportStatus>>, TError = ErrorType<unknown>>(jobId: string, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getImportStatus>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
/**
 * @summary List published entries for public directory
 */
export declare const getListPublicEntriesUrl: (params?: ListPublicEntriesParams) => string;
export declare const listPublicEntries: (params?: ListPublicEntriesParams, options?: RequestInit) => Promise<EntryListResponse>;
export declare const getListPublicEntriesQueryKey: (params?: ListPublicEntriesParams) => readonly ["/api/public/entries", ...ListPublicEntriesParams[]];
export declare const getListPublicEntriesQueryOptions: <TData = Awaited<ReturnType<typeof listPublicEntries>>, TError = ErrorType<unknown>>(params?: ListPublicEntriesParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listPublicEntries>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof listPublicEntries>>, TError, TData> & {
    queryKey: QueryKey;
};
export type ListPublicEntriesQueryResult = NonNullable<Awaited<ReturnType<typeof listPublicEntries>>>;
export type ListPublicEntriesQueryError = ErrorType<unknown>;
/**
 * @summary List published entries for public directory
 */
export declare function useListPublicEntries<TData = Awaited<ReturnType<typeof listPublicEntries>>, TError = ErrorType<unknown>>(params?: ListPublicEntriesParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listPublicEntries>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
/**
 * @summary Get a single published entry
 */
export declare const getGetPublicEntryUrl: (id: number) => string;
export declare const getPublicEntry: (id: number, options?: RequestInit) => Promise<Entry>;
export declare const getGetPublicEntryQueryKey: (id: number) => readonly [`/api/public/entries/${number}`];
export declare const getGetPublicEntryQueryOptions: <TData = Awaited<ReturnType<typeof getPublicEntry>>, TError = ErrorType<ErrorResponse>>(id: number, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getPublicEntry>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getPublicEntry>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetPublicEntryQueryResult = NonNullable<Awaited<ReturnType<typeof getPublicEntry>>>;
export type GetPublicEntryQueryError = ErrorType<ErrorResponse>;
/**
 * @summary Get a single published entry
 */
export declare function useGetPublicEntry<TData = Awaited<ReturnType<typeof getPublicEntry>>, TError = ErrorType<ErrorResponse>>(id: number, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getPublicEntry>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
/**
 * @summary Get directory stats for homepage
 */
export declare const getGetPublicStatsUrl: () => string;
export declare const getPublicStats: (options?: RequestInit) => Promise<PublicStats>;
export declare const getGetPublicStatsQueryKey: () => readonly ["/api/public/stats"];
export declare const getGetPublicStatsQueryOptions: <TData = Awaited<ReturnType<typeof getPublicStats>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getPublicStats>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getPublicStats>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetPublicStatsQueryResult = NonNullable<Awaited<ReturnType<typeof getPublicStats>>>;
export type GetPublicStatsQueryError = ErrorType<unknown>;
/**
 * @summary Get directory stats for homepage
 */
export declare function useGetPublicStats<TData = Awaited<ReturnType<typeof getPublicStats>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getPublicStats>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
/**
 * @summary Get featured/highlighted entries
 */
export declare const getGetFeaturedEntriesUrl: () => string;
export declare const getFeaturedEntries: (options?: RequestInit) => Promise<Entry[]>;
export declare const getGetFeaturedEntriesQueryKey: () => readonly ["/api/public/featured"];
export declare const getGetFeaturedEntriesQueryOptions: <TData = Awaited<ReturnType<typeof getFeaturedEntries>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getFeaturedEntries>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getFeaturedEntries>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetFeaturedEntriesQueryResult = NonNullable<Awaited<ReturnType<typeof getFeaturedEntries>>>;
export type GetFeaturedEntriesQueryError = ErrorType<unknown>;
/**
 * @summary Get featured/highlighted entries
 */
export declare function useGetFeaturedEntries<TData = Awaited<ReturnType<typeof getFeaturedEntries>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getFeaturedEntries>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
/**
 * @summary Get most recently added entries
 */
export declare const getGetRecentEntriesUrl: () => string;
export declare const getRecentEntries: (options?: RequestInit) => Promise<Entry[]>;
export declare const getGetRecentEntriesQueryKey: () => readonly ["/api/public/recent"];
export declare const getGetRecentEntriesQueryOptions: <TData = Awaited<ReturnType<typeof getRecentEntries>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getRecentEntries>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getRecentEntries>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetRecentEntriesQueryResult = NonNullable<Awaited<ReturnType<typeof getRecentEntries>>>;
export type GetRecentEntriesQueryError = ErrorType<unknown>;
/**
 * @summary Get most recently added entries
 */
export declare function useGetRecentEntries<TData = Awaited<ReturnType<typeof getRecentEntries>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getRecentEntries>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
/**
 * @summary Get public directory settings (no auth needed)
 */
export declare const getGetPublicSettingsUrl: () => string;
export declare const getPublicSettings: (options?: RequestInit) => Promise<DirectorySettings>;
export declare const getGetPublicSettingsQueryKey: () => readonly ["/api/public/settings"];
export declare const getGetPublicSettingsQueryOptions: <TData = Awaited<ReturnType<typeof getPublicSettings>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getPublicSettings>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getPublicSettings>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetPublicSettingsQueryResult = NonNullable<Awaited<ReturnType<typeof getPublicSettings>>>;
export type GetPublicSettingsQueryError = ErrorType<unknown>;
/**
 * @summary Get public directory settings (no auth needed)
 */
export declare function useGetPublicSettings<TData = Awaited<ReturnType<typeof getPublicSettings>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getPublicSettings>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export {};
//# sourceMappingURL=api.d.ts.map