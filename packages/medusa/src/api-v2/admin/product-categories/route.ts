import { createProductCategoryWorkflow } from "@medusajs/core-flows"
import {
  AdminProductCategoryListResponse,
  AdminProductCategoryResponse,
} from "@medusajs/types"
import {
  ContainerRegistrationKeys,
  remoteQueryObjectFromString,
} from "@medusajs/utils"
import { z } from "zod"
import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "../../../types/routing"
import { AdminProductCategoriesParamsType } from "./validators"

export const AdminCreateProductCategory = z.object({
  name: z.string(),
  description: z.string().optional(),
  handle: z.string().optional(),
  is_internal: z.boolean().optional(),
  is_active: z.boolean().optional(),
  parent_category_id: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
})

export type AdminCreateProductCategoryType = z.infer<
  typeof AdminCreateProductCategory
>

export const GET = async (
  req: AuthenticatedMedusaRequest<AdminProductCategoriesParamsType>,
  res: MedusaResponse<AdminProductCategoryListResponse>
) => {
  const remoteQuery = req.scope.resolve(ContainerRegistrationKeys.REMOTE_QUERY)

  const queryObject = remoteQueryObjectFromString({
    entryPoint: "product_category",
    variables: {
      filters: req.filterableFields,
      ...req.remoteQueryConfig.pagination,
    },
    fields: req.remoteQueryConfig.fields,
  })

  const { rows: product_categories, metadata } = await remoteQuery(queryObject)

  res.json({
    product_categories,
    count: metadata.count,
    offset: metadata.skip,
    limit: metadata.take,
  })
}

export const POST = async (
  req: AuthenticatedMedusaRequest<AdminCreateProductCategoryType>,
  res: MedusaResponse<AdminProductCategoryResponse>
) => {
  const { result, errors } = await createProductCategoryWorkflow(req.scope).run(
    {
      input: { product_category: { ...req.validatedBody } },
      throwOnError: false,
    }
  )

  if (Array.isArray(errors) && errors[0]) {
    throw errors[0].error
  }

  const remoteQuery = req.scope.resolve(ContainerRegistrationKeys.REMOTE_QUERY)

  const queryObject = remoteQueryObjectFromString({
    entryPoint: "product_category",
    variables: {
      filters: { id: result[0].id },
    },
    fields: req.remoteQueryConfig.fields,
  })

  const [product_category] = await remoteQuery(queryObject)

  res.status(200).json({ product_category })
}
