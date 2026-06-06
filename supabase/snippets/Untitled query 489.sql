with desired(value, label, default_color, ordinal) as (
    values
        ('cold', 'Por iniciar', '#7dbde8', 1),
        ('warm', 'En conversación', '#e8cb7d', 2),
        ('hot', 'Seguimiento prioritario', '#e88b7d', 3),
        ('in-contract', 'Cliente / en proceso', '#a4e87d', 4)
)
update public.configuration c
set config = jsonb_set(
    coalesce(c.config, '{}'::jsonb),
    '{noteStatuses}',
    (
        select jsonb_agg(
            jsonb_build_object(
                'value', desired.value,
                'label', desired.label,
                'color', coalesce(existing.item->>'color', desired.default_color)
            )
            order by desired.ordinal
        )
        from desired
        left join lateral (
            select item
            from jsonb_array_elements(coalesce(c.config->'noteStatuses', '[]'::jsonb)) item
            where item->>'value' = desired.value
            limit 1
        ) existing on true
    ),
    true
)
where c.id = 1;