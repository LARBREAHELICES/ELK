-- =============================================================================
--  stg_arxiv_papers.sql
--  Staging : normalisation des articles ArXiv depuis la table source brute
-- =============================================================================

with source as (
    select * from {{ source('raw', 'arxiv_papers_raw') }}
),

cleaned as (
    select
        arxiv_id,
        trim(title)                                as title,
        trim(abstract)                             as abstract,
        authors_flat,
        categories,
        split_part(categories, ' ', 1)             as primary_category,
        split_part(split_part(categories, ' ', 1), '.', 1) as domain,
        date_published,
        date_updated,
        doi,
        length(abstract)                           as abstract_length,
        array_length(string_to_array(categories, ' '), 1) as num_categories
    from source
    where arxiv_id is not null
      and abstract is not null
      and length(abstract) > 50
)

select * from cleaned
