begin;

create or replace function public.guard_application_status_transition()
returns trigger
language plpgsql
as $$
begin
  if auth.role() = 'service_role' or public.is_admin_email() then
    if new.status = 'INTERVIEW_SCHEDULED' and new.interview_at is null then
      raise exception 'interview_at is required when status is INTERVIEW_SCHEDULED';
    end if;
    if new.status <> 'INTERVIEW_SCHEDULED' then
      new.interview_at = null;
    end if;
    return new;
  end if;

  if not public.is_valid_application_status_transition(old.status, new.status) then
    raise exception 'Invalid application status transition: % -> %', old.status, new.status;
  end if;

  if new.status = 'INTERVIEW_SCHEDULED' and new.interview_at is null then
    raise exception 'interview_at is required when status is INTERVIEW_SCHEDULED';
  end if;

  if new.status <> 'INTERVIEW_SCHEDULED' then
    new.interview_at = null;
  end if;

  return new;
end;
$$;

commit;
