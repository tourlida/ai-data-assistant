# Database Schema Design Task

Inspect the provided CSV file and design a PostgreSQL database schema for it. The csv is located under `assigment-docs/sales_data.csv`.

## Instructions

Before writing any application code:

1. Analyze the CSV columns and sample values.
2. Identify the logical entities represented in the data.
3. Determine which fields should become separate tables rather than keeping everything in one table.
4. Identify primary keys and foreign-key relationships.
5. Choose appropriate PostgreSQL data types for every column.
6. Identify columns that should be `NOT NULL`, `UNIQUE`, or have `CHECK` constraints.
7. Identify data-quality issues, duplicates, or ambiguous fields.
8. Recommend indexes based on how the data is likely to be queried.
9. Explain the reasoning behind the schema decisions.
10. Consider whether the current CSV is denormalized and explain how you would normalize it.

## Deliverable

Create:

`agents/generated/database-schema.md`

The document should contain:

### 1. Dataset Analysis
- Number of rows
- Columns and their meanings
- Data types observed
- Null/missing values
- Duplicate values
- Potential identifiers
- Potential relationships between fields

### 2. Proposed Database Schema

For each table, document:

- Table name
- Column name
- PostgreSQL data type
- Nullable or `NOT NULL`
- Default value, if applicable
- Primary key
- Foreign keys
- Unique constraints
- Check constraints

### 3. Relationships

Explain the relationships between tables, for example:

- One-to-many
- One-to-one
- Many-to-many

Include a simple relationship diagram if useful.

### 4. Indexes

Recommend indexes based on expected query patterns.

For each index, explain:

- Which table/columns it covers
- What query it helps
- Why the index is justified

Do not create indexes simply because a column exists.

Remember:
- Primary keys and unique constraints already create indexes in PostgreSQL.
- Foreign keys do not automatically create indexes on the referencing columns.

### 5. Data Quality and Assumptions

Identify anything that is unclear from the CSV.

Examples:

- Whether an email is globally unique
- Whether a value represents an identifier or just a label
- Whether monetary values include discounts
- Whether cancelled/refunded records should count toward revenue
- Whether duplicate-looking records represent real duplicates

Do not silently invent business rules. Document assumptions instead.

### 6. Example Queries

Provide representative PostgreSQL queries that the schema should support, such as:

- Total sales
- Sales by customer
- Sales by product
- Sales by category
- Sales over time
- Top customers
- Filtering by date
- Filtering by status
- Joining customers, orders, and products

### 7. PostgreSQL DDL

At the end of the document, provide the complete PostgreSQL `CREATE TABLE` statements for the proposed schema.

Use appropriate PostgreSQL types such as:

- `BIGINT`
- `INTEGER`
- `NUMERIC`
- `TEXT`
- `BOOLEAN`
- `DATE`
- `TIMESTAMPTZ`
- `UUID`

Choose types based on the actual data and explain important choices.

## Important Constraints

- Analyze the actual CSV; do not assume its structure.
- Do not modify the CSV.
- Do not implement the Node.js backend yet.
- Do not implement the React frontend yet.
- Do not implement the AI chatbot yet.
- Do not create migrations yet.
- Do not create seed/import scripts yet.
- Do not send the raw dataset to an LLM.
- Keep the database design independent from the application implementation.

## Final Step

After creating `agents/generated/database-schema.md`:

1. Stop.
2. Give me a concise summary of the proposed schema.
3. List the main design decisions.
4. List any assumptions or questions that require my review.

Do not proceed to implementation until I explicitly approve the schema.