# Planned File Structure

This file explains the structure planned for the project's essential functions. This contains the basic algorithms and instructions on what errors are to be handled in each function. The instructions are written in an understanding based on Python. You are meant to convert the meaning into terminology for TS and perform tasks accordingly. Many of the TS files mentioned here have not been created yet. You will create them as and when required.

## 1. Static Queries : `llm_brain/staticQueries.ts`

This file contains functions that are meant to store the structure of the basic static queries for each LLM related functionality. These contain the following functions with their respective query values :
- **isolateParameterQuery(returnSchemaDescription)** : 
    - Creates a static prompt where `<returnSchema>` is replaced with the returnSchemaDescription value.
    - This prompt is meant to be used to isolate values from a string input to populate `bookingDetails` structure. 
    - Create a prompt that well suits this kind of purpose. Assume the LLM used will be Gemini for now but might change later.
No errors are expected or handled in these functions

## 2. LLM Output Structures : `llm_brain/llmOutputStructures.ts`

This file contains all return classes for the LLM's structured returns. These contain the following classes with the following values and functions :
- **foodRequirements**
    - **food_title** : string representing breakfast, lunch, dinner or other
    - **dishes** : list of string showing specifically required dishes
    - **allergies** : list of string showing specific allergies in case any items need to be avoided
    - **notes** : string showing any additional requirements like vegan, etc
    - **getDescription()** : returns a stringified json dict showing the values used in this class and what they are. To be used later as reference for LLM
    - **verifyNonEmpty()** : this function verifies the following, raises "ValueMissingError: X" (replacing X with the missing value) if any of these policies are violated :
        - **food_title** is not empty
        - **dishes** is not empty
    - **getGenerationConfig()** : This function returns the generationConfig instance for this class structure.  Return type is Generation Config object.
- **dayDistribution**
    - **day_number** : integer, meant to show this is the nth day details
    - **hall_name** : string showing the name of the hall/room booked
    - **start_time** : date time value for the starting time of the booking
    - **end_time** : date time value for the ending time of the booking
    - **food_requirements** : list of foodRequirements, showing what foods are for each hall/room at what time, etc
    - **special_requirements** : list of string, showing special requirements such as floral arrangements, ice sculptures, etc
    - **expected_head_count** : integer, showing how many people are expected in this room/hall
    - **getDescription()** : returns a stringified json dict showing the values used in this class and what they are. To be used later as reference for LLM
    - **verifyTimes()** : this function verifies the following, raises "InvalidValueError" if any of these policies are violated :
        - start time is not empty
        - start time is a valid date time format
        - end time is not empty
        - end time is a valid date time format
        - end time comes after start time
    - **verifyNonEmpty()** : this function verifies the following, raises "ValueMissingError: X" (replacing X with the missing value) if any of these policies are violated :
        - day_number is not empty
        - hall_name is not empty
        - food_requirements is not empty
    - **getGenerationConfig()** : This function returns the generationConfig instance for this class structure. Return type is Generation Config object.
- **bookingDetails** 
    - **booking_title** : string showing what this booking is for
    - **booking_name** : string showing under whose name the booking is registered
    - **phone_number** : string showing the phone number of the contact person regarding further clarifications or other requirements related to booking
    - **email** : string showing the email id of the contact person regarding further clarifications or other requirements related to booking
    - **booking_duration** : integer storing total number of days
    - **total_guests** : integer storing total number of guests
    - **day_distribution** : list of dayDistribution, showing how each day is booked
    - **budget** : long integer showing the budget of the booking party
    - **currency** : string showing currency of the booking budget
    - **getDescription()** : returns a stringified json dict showing the values used in this class and what they are. To be used later as reference for LLM
    - **verifyNonEmpty()** : this function verifies the following, raises "ValueMissingError: X" (replacing X with the missing value) if any of these policies are violated :
        - booking_title is not empty
        - booking_name is not empty
        - phone_number is not empty
        - email is not empty
        - booking_duration is not empty
        - total_guests is not empty
        - day_distribution is not empty
        - budget is not empty
        - currency is not empty
    - **verifyEmail()** : this function checks if **email** is of the format "sample@mail.com" using regex and raises "EmailError: Invalid Email" if the email doesn't follow this format
    - **getGenerationConfig()** : This function returns the generationConfig instance for this class structure. Return type is Generation Config object. This function is meant to return a nested schema for all sub classes/structures within this such as the `day_distribution` variable for example. All internal nests are included.

> Note : Any instance of Empty/None represents a null/similar values. Since these are returned by the LLM, I would like to keep the possibility open that the LLM might return empty values when not working as intended and hence I would like to add checks for that as a guardrail. All date time formats should be in the structure DD-MM-YYYY hh:mm:ss. Stringified JSON from descriptions are meant to be for prompt injections, plan accordingly.

> **bookingDetails vs Proposales proposal (authoritative):** The LLM first produces structured **`bookingDetails`** (§2) via `isolateParameters` / `runIsolator`. Application code then **maps** that object (plus user `query`, `company_id`, and selected product records) into the **`createProposal` request body** (§5). The LLM does **not** emit the full Proposales proposal JSON shape directly. If mapping cannot fill a field, use the **minimal defaults** listed under **createProposal — minimal first version** in **Implementation contracts** below.

## 3. LLM Connectors : `llm_brain/llmConnectors.ts`

This file contains all functions for creating and maintaining instances for LLMs. In python, an instance of Gemini is first created with configuration and API key values before invoking the generation function. This is meant to do something like that for TypeScript. 
These contain the following functions :
- **getGeminiApiKey()** : 
    - Gets Gemini api key from .env file. 
    - If API key is not available, raise 'APIKeyError'
- **setGeminiFlash(staticQuery, generationConfig)** : 
    - Gets gemini api key using getGeminiApiKey function.
    - Creates and returns an instance of Gemini 2.5 flash. 
    - The parameter `staticQuery` is for systemInstructions and the `generationConfig` is an instance of GenerationConfig returned by getGenerationConfig of the appropriate structure.
- **setGeminiFlashLite(staticQuery, generationConfig)** : 
    - Gets gemini api key using getGeminiApiKey function. 
    - Creates and returns an instance of Gemini 2.5 flash lite. 
    - The parameter `staticQuery` is for systemInstructions and the `generationConfig` is an instance of GenerationConfig returned by getGenerationConfig of the appropriate structure.
- **setGeminiPro(staticQuery, generationConfig)** : 
    - Gets gemini api key using getGeminiApiKey function. 
    - Creates and returns an instance of Gemini 2.5 pro. 
    - The parameter `staticQuery` is for systemInstructions and the `generationConfig` is an instance of GenerationConfig returned by getGenerationConfig of the appropriate structure.

## 4. LLM Controllers : `llm_brain/llmControllers.ts`

- **isolateParameters(userQuery, llmInstance)** :
    - The `llmInstance` is already constructed with **`systemInstruction`** (`staticQuery`) and **`generationConfig`** (from **`bookingDetails.getGenerationConfig()`** in `llmOutputStructures`). Do not rely on a second parallel config unless you intentionally override per request.
    - **Prompt assembly:** **User** message text = `isolateParameterQuery(<returnSchemaDescription>)` where `<returnSchemaDescription>` is the **`getDescription()`** output for **`bookingDetails`** (§2; must describe nested `day_distribution` and `food_requirements`), then newline + the raw **`userQuery`**.
    - Parse model output as JSON into **`bookingDetails`** shape, then verify in this **order** (fail fast on first error):
        1. **`bookingDetails`**: `verifyNonEmpty`, then `verifyEmail`.
        2. For each item in **`day_distribution`**: `verifyNonEmpty`, then `verifyTimes`, then for each **`food_requirements`** item: `verifyNonEmpty` (food).
    - If any verification **throws**, regenerate (same model) up to **3** attempts total.
    - After the **3rd** attempt, if data is still invalid, return the **last parsed object** as-is and set **`verificationRequired: true`** (boolean JSON / TypeScript `boolean`) on the wrapper object returned to callers.
- **runIsolator(userQuery)** : 
    - Invoke **`isolateParameters`** using instances from **Flash → Pro → Lite** (see connectors). Wrap in try/catch per tier.
    - Treat **rate limiting** as: the **`@google/generative-ai`** client throws an **`Error`**; detect **429** via **`message`**, **`status`**, or **`code`** on the error or nested cause (exact shape may vary). If it is **not** a rate-limit error, you may still try the next tier per your app policy — document failures in logs.
    - **Cycle:** attempt the full Flash → Pro → Lite sequence once; **repeat that outer cycle at most once** (two passes total), then return **`null`** / **`None`** if nothing succeeded.

> Note that the model order is based on suitability for this purpose rather than power or quota size.

## 5. Server Connectors : `server_connect/proposalesConnector.ts`

> Note: Structure of proposal block : {
  updated_at?: number
  source_content_updated_at?: number
  comment?: string
  content_id?: number
  currency?: string
  description?: string
  fixed_discount?: number
  image_uuids?: string[]
  inventory_connected?: boolean
  language: string
  multi_product_data?: MultiProductRow[]
  multi_product_enabled?: boolean
  optional_picked?: boolean
  optional?: boolean
  package_split?: PackageSplit
  percent_discount?: number
  quantity_editable?: boolean
  quantity_max?: number
  quantity_min?: number
  quantity_variable_data?: string
  quantity_variable?: boolean
  quantity_visible?: boolean
  quantity?: number
  recurring?: boolean
  relative?: boolean
  sources?: {
    integration: {
      integrationId: number
      uniqueId: string
      metadata: Record<string, unknown>
    }
  }
  title?: string
  type: 'product-block' | 'video-block'
  unit_value_with_discount_with_tax?: number
  unit_value_with_discount_without_tax?: number
  unit_value_without_discount_with_tax?: number
  unit_value_without_discount_without_tax?: number
  unit?: Unit
  uuid: string
  video_url?: string
}

> Note: Structure of proposal attachment : {
    id: number
    mime_type: string
    name: string
    // For text/html: url is present, uuid is absent
    // For other types: uuid is present, url is absent
    url?: string
    uuid?: string
}

- **DUMMY_COMPANIES** : 
    - static list of dummy companies
    - array of JSON dict
    - structure of company : {
      "id": 123,
      "created_at": 123,
      "name": "<string>",
      "currency": "<string>",
      "tax_mode": "<string>",
      "registration_number": "<string>",
      "website_url": "<string>"
    }
- **DUMMY_PRODUCTS** :
    - static list of dummy products
    - array of JSON dict
    - structure of product : {
      "created_at": 123,
      "description": {} - dicts,
      "product_id": 123,
      "variation_id": 123,
      "title": {} - dicts,
      "is_archived": {} - dicts,
      "sources": {} - dicts,
      "images": [
        {} - dicts
      ],
      "integration_id": 123,
      "integration_metadata": {}
    }
- **DUMMY_PROPOSALS** :
    - static list of dummy proposals
    - array of JSON dict
    - structure of proposal : {
        archived_at: number | null
        attachments: proposal_attachment[]
        background_image: {
            id: number
            uuid: string
        } | null
        background_video: {
            id: number
            uuid: string
        } | null
        blocks: proposal_block[]
        company_powerups: Powerups
        company_registration_number: string | null
        company_tax_mode_live: 'standard' | 'simplified' | 'tax-free' | 'none'
        company_website: string | null
        contact_avatar_uuid: string | null
        contact_email: string
        contact_id: number
        contact_name: string | null
        contact_phone: string | null
        contact_title: string | null
        creator_id: number
        creator_name: string | null
        currency: string
        data: ProposalData
        description_md: string | null
        editor: {
            cc?: number[]
            notification_user_ids?: number[]
        }
        expires_at: number | null
        invoicing: {
            data_prefill?: any
            data?: {
            [x: string]: string
            }
            enabled?: boolean
            form_overrides?: object
            reminder_sent_at?: string
            submitted_at?: string
        }
        is_agreement: boolean
        is_only_proposal_in_series: boolean
        is_test: boolean
        language: string
        pdf_url: string | null
        pending: boolean
        pending_reason: string | null
        recipient_company_name: string | null
        recipient_email: string | null
        recipient_id: number | null
        recipient_is_set: boolean
        recipient_name: string | null
        recipient_phone: string | null
        signatures: {
            date: string
            ip: string
            name: string
            user_agent: string
            user_id?: number
        }[]
        status_changed_at: number
        status: ('accepted' | 'active' | 'draft' | 'expired' | 'rejected' | 'template' | 'withdrawn' | 'replaced') | null
        tax_options: {
            mode?: ('standard' | 'simplified' | 'tax-free' | 'none')
            tax_included?: boolean
            tax_label_key?: string
        }
        title_md: string | null
        tracking: {
            accepted_at?: string
            accepted_by_mobile?: boolean
            created_from_proposal?: string
            created_from_rfp?: number
            created_from_template?: string
            expired_at?: string
            expiration_reminder_sent_at?: string
            first_viewed_at?: string
            last_viewed_at?: string
            number_of_views?: number
            rejected_at?: string
            sent_at?: string
            withdrawn_at?: string
            marked_as_accepted_by_user?: {
            email?: string
            id: number
            name?: string
            }
        }
        updated_at: number
        uuid: string
        value_with_tax: number
        value_without_tax: number
        version: number | null
        }
- **getProposalesApiKey()** : 
    - Gets Proposales API key from `.env` (e.g. **`PROPOSALES_API_KEY`**).
    - If the key is **missing or empty** after trim, raise **`APIKeyError`**.
    - **Do not** return random or placeholder keys from this function. Misconfiguration must fail visibly. Call sites that need offline/demo behavior should **catch HTTP errors** and return **DUMMY_*** payloads **there**, not inside the key getter.
- **listCompanies()** :
    - type : GET
    - path : /v3/companies
    - Perform api call to this path. 
    - Headers : { Authorization : Bearer getProposalesApiKey() }
    - Response Structure : {
        "data": [
            {
                "id": 123,
                "created_at": 123,
                "name": "<string>",
                "currency": "<string>",
                "tax_mode": "<string>",
                "registration_number": "<string>",
                "website_url": "<string>"
            }
        ]
    }
    - Encase call in try-catch. 
    - On Exception, log exception details and return DUMMY_COMPANIES
- **listProducts()** :
    - type : GET
    - path : /v3/content
    - Perform api call to this path. 
    - Headers : { Authorization : Bearer getProposalesApiKey() }
    - Response Structure : {
        "data": [
            {
                "created_at": 123,
                "description": {},
                "product_id": 123,
                "variation_id": 123,
                "title": {},
                "is_archived": {},
                "sources": {},
                "images": [
                    {}
                ],
                "integration_id": 123,
                "integration_metadata": {}
            }
        ]
    }
    - Encase call in try-catch. 
    - On Exception, log exception details and return DUMMY_PRODUCTS
- **createNewProduct()** :
    - type : POST
    - path : /v3/content
    - Perform api call to this path. 
    - Headers : { Authorization : Bearer getProposalesApiKey() }
    - Body structure : {
        "company_id": The ID of the Proposales company that the content should belong to.,
        "language": "<string>" - A two-letter **ISO 639-1** language code (e.g. `en`, `sv`) for the content language.,
        "title": "<string>" - The title of the content in the specified language.,
        "description": "<string>" - The description of the content in the specified language.,
        "images": [
            {
                "uuid": "",
                "url": "https://example.com/image.jpg" - Provide a publicly accessible image URL.
            }
        ] - A list of images to be added to the content. 
    }
    - Response Structure : {
        "data": {
            "product_id": 123,
            "variation_id": 123,
            "message": "<string>"
        }
    }
    - Encase call in try-catch. 
    - On Exception, log exception details. Add new product to DUMMY_PRODUCTS (with id) and return entered product data
- **updateExistingProduct()** : 
    - type : PUT
    - path : /v3/content
    - Perform api call to this path. 
    - Headers : { Authorization : Bearer getProposalesApiKey() }
    - Body structure : {
        "variation_id": The variation ID of the product to update. Either this or product_id must be provided,
        "product_id": The product ID to update. Either this or variation_id must be provided. This is often more convenient when you have the product ID rather than the variation ID,
        "language": "<string>" - A two-letter **ISO 639-1** language code for the content to update.,
        "title": "<string>" - The new title of the content in the specified language,
        "description": "<string>" - The new description of the content in the specified language.,
        "images": [
            {
                "uuid": "",
                "url": "https://example.com/image.jpg" - Provide a publicly accessible image URL
            }
        ]
    }
    - Response Structure : {
        "data": {
            "product_id": 123,
            "variation_id": 123,
            "message": "<string>"
        }
    }
    - Encase call in try-catch. 
    - On Exception, log exception details. For each entry in DUMMY_PRODUCTS, if **`entry.product_id`** equals the request **`product_id`** **or** **`entry.variation_id`** equals the request **`variation_id`** (whichever identifiers were passed), update that entry with the new values.
- **createProposal()** :
    - type : POST
    - path : /v3/proposals
    - Perform api call to this path. 
    - Headers : { Authorization : Bearer getProposalesApiKey() }
    - Body Structure : {
        "company_id": The ID of the Proposales company that the proposal draft should belong to.,
        "language": "<string>" - A two-letter **ISO 639-1** language code for the proposal,
        "creator_email": "<string>" - Email address of the user who should be set as the creator of this proposal,
        "contact_email": "<string>",
        "background_image": {},
        "background_video": {},
        "title_md": "<string>",
        "description_md": "<string>",
        "recipient": {},
        "data": {},
        "invoicing_enabled": true,
        "tax_options": {},
        "blocks": [
            {}
        ],
        "attachments": [
            {}
        ]
    }
    - Response Structure : {
        "proposal": {
            "uuid": "<string>",
            "url": "<string>"
        }
    }
    - Encase call in try-catch. 
    - On Exception, log exception details. Add new entry to DUMMY_PROPOSALS with id and return newly entered proposal entry
- **getSingleProposal(proposal_id)** :
    - type : GET
    - path : /v3/proposals/{proposal_id}
    - Perform api call to this path. 
    - Headers : { Authorization : Bearer getProposalesApiKey() }
    - Return Structure : {
        "data": {
            "title": "<string>",
            "title_md": "<string>",
            "description_html": "<string>",
            "description_md": "<string>",
            "archived_at": 123,
            "attachments": [
            {}
            ],
            "background_image": {
            "id": 123,
            "uuid": "<string>"
            },
            "background_video": {
            "id": 123,
            "uuid": "<string>"
            },
            "blocks": [
            {}
            ],
            "company_address": "<string>",
            "company_email": "<string>",
            "company_id": 123,
            "company_logo_uuid": "<string>",
            "company_powerups": {},
            "company_powerups_live": {},
            "company_name": "<string>",
            "company_phone": "<string>",
            "company_registration_number": "<string>",
            "company_tax_mode_live": "<string>",
            "company_timezone": "<string>",
            "company_avatar_uuid": "<string>",
            "contact_email": "<string>",
            "contact_name": "<string>",
            "contact_phone": "<string>",
            "contact_title": "<string>",
            "creator_id": 123,
            "creator_name": "<string>",
            "currency": "<string>",
            "data": {},
            "editor": {
            "notification_user_ids": {}
            },
            "expires_at": 123,
            "invoicing": {},
            "is_agreement": true,
            "is_only_proposal_in_series": true,
            "is_test": true,
            "pending": true,
            "pending_reason": "<string>",
            "recipient_company_name": "<string>",
            "recipient_email": "<string>",
            "recipient_id": 123,
            "recipient_is_set": true,
            "recipient_name": "<string>",
            "recipient_phone": "<string>",
            "recipient_sources": {},
            "series_uuid": "<string>",
            "signatures": [
            {}
            ],
            "status_changed_at": 123,
            "tax_options": {},
            "tracking": {},
            "updated_at": 123,
            "value_with_tax": 123,
            "value_without_tax": 123,
            "version": 123,
            "payments_enabled": true,
            "contact_avatar_transform": "<string>",
            "user_email": "<string>",
            "payment": {},
            "status": "<string>",
            "uuid": "<string>",
            "language": "<string>",
            "background_image_uuid": "<string>"
        }
        }
    - Encase call in try-catch. 
    - On Exception, log exception details. For each entry in DUMMY_PROPOSALS, if **`entry.uuid`** equals **`proposal_id`** (string match), return that entry.
- **searchProposals(search_string)** :
    - type : GET
    - path : /v3/proposal-search
    - Query : append **`?q=`** + **URL-encoded** `search_string` (e.g. `encodeURIComponent` in TypeScript). *If the live Proposales OpenAPI names the query parameter differently, use the documented name and update this line.*
    - Perform api call to this path. 
    - Headers : { Authorization : Bearer getProposalesApiKey() }
    - Response Structure : {
        "data": {
            "created_at": 123,
            "updated_at": 123,
            "title": "<string>",
            "uuid": "<string>",
            "series_uuid": "<string>",
            "company_id": 123,
            "version": 123,
            "status": "<string>",
            "data": {}
        }
        }
    - Encase call in try-catch. 
    - On Exception, log exception details. For entry in DUMMY_PROPOSALS, if any string content has search_string inside it, return entry.

-----

# Implementation contracts (authoritative for builders)

These rules remove ambiguity when implementing TypeScript / Next.js. They **override** older one-line notes where they conflict.

## Identifiers

- **`company` in `POST /api/generate-proposal`:** numeric **company id** from `listCompanies` / UI `companiesList` — same value as Proposales **`company_id`**.
- **Product selection is server-side:** the client does **not** send **`product_ids`**. The server calls **`listProducts()`**, runs deterministic keyword extraction + scoring, then **`runProductRecommender`** (Gemini) to choose **`product_id`** values. Resolved rows use **`variation_id`** from the matching catalog row.
- **`proposal_id` in `GET /api/get-single-proposal/{proposal_id}` and `GET /v3/proposals/{proposal_id}`:** the proposal **`uuid`** string unless OpenAPI explicitly documents otherwise.

## Product lookup for `generate-proposal`

- Re-fetch via **`listProducts()`** on each generate request (or use an in-memory cache if added later).
- **Deterministic step:** tokenize/normalize **`query`**, drop stopwords, score products whose **title/description** text matches keywords (title hits weighted higher than description). Cap candidates (e.g. **`MAX_PRODUCT_CANDIDATES`**).
- **LLM step:** from candidates only, output **`selected_product_ids`**; invalid ids are dropped. **No** fallback that pretends unmatched products were “recommended.”
- If there are **no** keyword candidates, the recommender fails, or the model returns **no** valid ids, the API returns **`created: false`** and **`recommended_products: []`** — **do not** call **`createProposal`** in those cases.
- If ids are valid, resolve full rows and pass them into **`createProposal` → `data`** (and mapper).

## `createProposal` — suggested `data` payload

Embed traceability for the UI and debugging, e.g.:

```json
{
  "source": "rfp_pipeline",
  "user_query": "<string>",
  "selected_product_ids": [1, 2],
  "products": [
    { "product_id": 1, "variation_id": 1, "title": {}, "description": {} }
  ]
}
```

Rename keys only if Proposales rejects them; keep the structure **stable** in app code.

## `createProposal` — minimal first version (unmapped fields)

When mapping from **`bookingDetails`** leaves gaps:

| Field | Default |
|--------|---------|
| `background_image`, `background_video` | `{}` or omit per OpenAPI |
| `recipient` | `{}` or `{ "email": "<from bookingDetails.email if valid>" }` |
| `tax_options` | `{}` or `{ "mode": "standard" }` if required |
| `blocks` | At least one block with markdown body derived from **`query` + booking summary**. **Exact block shape must match OpenAPI** — use the smallest valid object from docs if unsure. |
| `attachments` | `[]` |
| `invoicing_enabled` | `false` unless product rules require `true` |

## End-to-end `POST /api/generate-proposal` (server)

1. Validate body: **`company`** present, **`query`** length ≥ 50 after **trim**. Do **not** require client **`product_ids`**.
2. **`listProducts()`** → deterministic keywords from **`query`** → score/filter → candidate list.
3. **`runProductRecommender(query, candidates)`** → **`selected_product_ids`** (subset of candidates). If empty / failure → return **`created: false`**, **`reason`**, **`recommended_products: []`**, **`diagnostics`** — **skip** **`createProposal`**.
4. Run **`runIsolator(query)`** → **`bookingDetails`**; respect **`verificationRequired`**. If isolator fails entirely → **502** (no proposal created); response may still include **`recommended_products`** for debugging.
5. **Map** `bookingDetails` + `query` + `company` + **LLM-resolved** product rows → **`createProposal`** body (`company_id` = `company`, default **`language`:** `en`, etc.).
6. Call **`createProposal`**, then **`getSingleProposal(uuid)`**.
7. **Response:** stable shape, e.g. `{ "created": true, "recommended_products": [...], "create": ..., "proposal": ..., "verificationRequired": ..., "diagnostics": ... }`. When **`created`** is false, **`create`** / **`proposal`** are omitted.

## URL encoding

- **`POST /api/generate-proposal`:** JSON body — **no** URL-encoding of `query`.
- **`GET /api/search-proposal/{search_string}`:** use **`encodeURIComponent(search_string)`** for the path segment when building the URL, **or** pass search as a **query param** on your Next route and forward to Proposales **`q=`**.

## Next.js API wrappers

- **`POST /api/create-product`** / **`PUT /api/update-product`:** forward the **JSON body** from the client as the Proposales body (same keys as §5), after setting default **`language`:** `en` on create when missing.

-----

# API Endpoints :

## 1. Generate Proposal
    - Path : `api/generate-proposal`
    - Type : POST
    - body : {
        "query": user_entered_query,
        "company": user_selected_company_id
    }
    - Algorithm : 
        > Validate `company` and `query` (length ≥ 50 after trim).
        > **`listProducts()`** → deterministic keyword filter → **`runProductRecommender`** → resolved product rows (see **Implementation contracts**). If none, return **`created: false`** and do not create a proposal.
        > Call **`runIsolator(query)`** → **`bookingDetails`**; verify per §4 (or return 502 if isolator unavailable).
        > Map **`bookingDetails` + query + company + recommended products** → **`createProposal`** body.
        > Call **`createProposal`**, then **`getSingleProposal(uuid)`** when created.
        > Return JSON including **`recommended_products`**, **`created`**, **`diagnostics`**, and proposal fields when applicable.

## 2. Get Companies
    - Path : `api/get-companies`
    - Type : GET
    - Algorithm : Perform the listCompanies call and return resulting content

## 3. Get Products
    - Path : `api/get-products`
    - Type : GET
    - Algorithm : Perform the listProducts call and return resulting content

## 4. Create New Product
    - Path : `api/create-product`
    - Type : POST
    - Algorithm : If passed data does not have language, set language to 'en'. Perform the createNewProduct call and return resulting content.

## 5. Update Existing Product
    - Path : `api/update-product`
    - Type : PUT
    - Algorithm : Perform the updateExistingProduct call and return resulting content

## 6. Get Single Proposal
    - Path : `api/get-single-proposal/{proposal_id}`
    - Type : GET
    - Algorithm : Perform the getSingleProposal call and return resulting content

## 7. Search Proposal
    - Path : `api/search-proposal/{search_string}`
    - Type : GET
    - Algorithm : Performs the **`searchProposals`** call and returns resulting content. The segment **`{search_string}`** must be **URL-encoded** when building the request (see **Implementation contracts**). Proposales is called with **`?q=`** + encoded string unless OpenAPI specifies another name.

# Front End

Create a visually pleasing, light themed front end.

## On Page Render, The following actions take place :

1. Fetch list of companies
2. Set list to global state variable in page called `companiesList`
3. Render a drop-down for users to select their company (`companiesList`)
4. (Optional) Product catalog is **not** loaded for manual selection; products are chosen server-side from `listProducts()` during generate

## Sections in UI Layout :

- Proposal Search bar : for users to search their previous proposals. OnSubmit, it invokes the Search Proposal endpoint for result.
- Company Drop Down Menu Selector : Visible and populated after fetching companies list.
- Request Entry : User enters requirements (prompt). Server derives product matches from this text.
- Recommended products (after generate) : show **`recommended_products`** from the API when present.
- "Fetch Proposal" Button : performs api call to `api/generate-proposal` with **`query`** + **`company`** only.
- Result Display : When **`created`** is true, show proposal fields; when false, show reason / empty state without implying a proposal was stored.

## Layouts for populating values :

- Company Drop down :
    Company ID - Company Name/Title

- Recommended products (from API response) :
    Product ID, title (bold), description (smaller)

- Result Display (sample structure for grid. Expand this structure) : 
    Key1 : Value1       Key2 : Value2
    Key3 : Value3       Key4 : Value4
    Key5 : Value5       Key6 : Value6

## Submit conditions for Generating proposals :

- Company must be selected
- User's request/prompt must have **at least 50 characters** after **trim**. Send `query` as a normal **JSON string** in **`POST /api/generate-proposal`** (no URL encoding). Use **`encodeURIComponent`** only when placing text in a **URL path or query** (e.g. proposal search), not for the generate body.

## Prompts/Titles for sections :

- Company Selector : "Select your company"
- User Prompt : "What are your requirements?" (products are inferred automatically)

> Note: "Proposals" and "Proposales" are two different terms. "Proposals" is a data structure. "Proposales" is a database that is accessed using API key.