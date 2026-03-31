-- =============================================================================
--  fct_publications_par_mois.sql
--  Mart : volume de publications par mois et par catégorie primaire
-- =============================================================================

with papers as (
    select * from {{ ref('stg_arxiv_papers') }}
),

monthly as (
    select
        date_trunc('month', date_published)::date  as mois,
        primary_category,
        domain,
        count(*)                                    as nb_publications,
        avg(abstract_length)::int                   as longueur_abstract_moyenne,
        avg(num_categories)::numeric(3,1)           as nb_categories_moyen
    from papers
    group by 1, 2, 3
)

select * from monthly
order by mois desc, nb_publications desc
