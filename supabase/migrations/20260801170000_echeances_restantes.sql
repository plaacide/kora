-- Rattraper TOUTES les échéances, pas seulement celles posées à minuit.
--
-- La migration précédente ne reprenait que les échéances à `00:00:00`, en
-- réservant celles qui portent une heure : « elles viennent d'ailleurs et on
-- ne sait pas ce qu'elles voulaient dire ». C'était faux, et la vérification
-- l'a montré — quatre invitations restaient à des heures comme 10:19:09.
--
-- Aucun appelant n'a jamais choisi d'heure : l'assistant ne propose qu'un
-- champ DATE. Toute heure non nulle vient donc du défaut à quatre-vingt-dix
-- jours, qui figeait l'instant de l'envoi. Un accès créé à 10:19 mourait à
-- 10:19 le quatre-vingt-dixième jour — au milieu d'une journée de travail,
-- sans que personne l'ait décidé.
--
-- Ré-exécutable, et sans effet une fois passée : la condition compare à ce
-- que `fin_de_journee` produirait.

update public.invitations
set expires_at = public.fin_de_journee(expires_at)
where expires_at is not null
  and expires_at <> public.fin_de_journee(expires_at);

-- Les permissions recopient l'échéance à l'acceptation : les oublier laisse
-- l'accès se refermer à l'heure de l'envoi, une couche plus bas.
update public.permissions
set expires_at = public.fin_de_journee(expires_at)
where expires_at is not null
  and expires_at <> public.fin_de_journee(expires_at);
