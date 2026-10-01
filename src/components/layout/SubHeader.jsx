export default function SubHeader({

    title = "New Conversation",

    description = null,

    action = null,

    hideHeader = false,

    children = null,

}) {

    if (hideHeader) return null;

  return (
    <header className="app-subheader sticky top-0 z-20">
      {children && <div className="px-8 pt-4">{children}</div>}
      <div className="flex items-center justify-between gap-4 px-8 py-6">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">{title}</h2>
          {description && <p className="mt-1 text-sm text-slate-500">{description}</p>}
        </div>
        {action}
      </div>
    </header>
  );
}
