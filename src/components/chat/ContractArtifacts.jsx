import { useState } from "react";
import {
  Download,
  FileSpreadsheet,
  GitCompare,
  ShieldCheck,
  Table2,
} from "lucide-react";

import { downloadExport } from "../../services/contractsService";

const VERDICT_STYLES = {
  pass: "bg-emerald-50 text-emerald-800 ring-emerald-200",
  fallback: "bg-amber-50 text-amber-900 ring-amber-200",
  missing: "bg-rose-50 text-rose-800 ring-rose-200",
  off_playbook: "bg-rose-50 text-rose-800 ring-rose-200",
  unclear: "bg-slate-100 text-slate-700 ring-slate-200",
  not_applicable: "bg-slate-50 text-slate-500 ring-slate-200",
};

const STATUS_STYLES = {
  found: "bg-emerald-50 text-emerald-800",
  missing: "bg-rose-50 text-rose-700",
  unclear: "bg-amber-50 text-amber-800",
  error: "bg-rose-50 text-rose-700",
};

function verdictLabel(value) {
  return String(value || "").replace(/_/g, " ");
}

function ClauseCardsPanel({ cards, filename, onDownload, downloading }) {
  if (!cards?.length) return null;
  return (
    <section className="rounded-2xl border border-slate-200/80 bg-[#FBFBFC] p-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-[12px] font-medium uppercase tracking-wide text-slate-500">
          <FileSpreadsheet size={14} />
          <span>Clause cards{filename ? ` · ${filename}` : ""}</span>
        </div>
        {onDownload && (
          <button
            type="button"
            disabled={downloading}
            onClick={onDownload}
            className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[12px] font-medium text-slate-700 hover:bg-white disabled:opacity-50"
          >
            <Download size={13} />
            DOCX
          </button>
        )}
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        {cards.map((card) => (
          <div
            key={card.key}
            className="rounded-xl border border-slate-200/70 bg-white px-3 py-2.5"
          >
            <div className="flex items-start justify-between gap-2">
              <p className="text-[13px] font-semibold text-slate-800">
                {card.label}
              </p>
              <span
                className={`shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-medium uppercase ${
                  STATUS_STYLES[card.status] || STATUS_STYLES.unclear
                }`}
              >
                {card.status}
              </span>
            </div>
            <p className="mt-1 text-[13px] leading-5 text-slate-700">
              {card.value || "—"}
            </p>
            {card.quote && (
              <blockquote className="mt-2 border-l-2 border-slate-300 pl-2 text-[12px] leading-5 text-slate-500">
                {card.quote}
              </blockquote>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

function ReviewTablePanel({ table, onDownload, downloading }) {
  const columns = table?.columns || [];
  const rows = table?.rows || [];
  if (!columns.length || !rows.length) return null;

  return (
    <section className="rounded-2xl border border-slate-200/80 bg-[#FBFBFC] p-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-[12px] font-medium uppercase tracking-wide text-slate-500">
          <Table2 size={14} />
          <span>Review table · {rows.length} files</span>
        </div>
        {onDownload && (
          <button
            type="button"
            disabled={downloading}
            onClick={onDownload}
            className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[12px] font-medium text-slate-700 hover:bg-white disabled:opacity-50"
          >
            <Download size={13} />
            DOCX
          </button>
        )}
      </div>
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="min-w-full border-collapse text-left text-[12px]">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="sticky left-0 bg-slate-50 px-3 py-2 font-semibold">
                Document
              </th>
              {columns.map((column) => (
                <th key={column.key} className="px-3 py-2 font-semibold">
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const cells = Object.fromEntries(
                (row.cells || []).map((cell) => [cell.key, cell])
              );
              return (
                <tr
                  key={row.documentId || row.document_id || row.filename}
                  className="border-t border-slate-100"
                >
                  <td className="sticky left-0 max-w-[160px] truncate bg-white px-3 py-2 font-medium text-slate-800">
                    {row.filename}
                  </td>
                  {columns.map((column) => {
                    const cell = cells[column.key];
                    const value =
                      !cell || cell.status === "missing"
                        ? "—"
                        : cell.value || cell.status;
                    return (
                      <td
                        key={column.key}
                        className="max-w-[200px] truncate px-3 py-2 text-slate-700"
                        title={value}
                      >
                        {value}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function PlaybookPanel({ review, onDownload, downloading }) {
  if (!review?.findings?.length) return null;
  const summary = review.summary || {};

  return (
    <section className="rounded-2xl border border-slate-200/80 bg-[#FBFBFC] p-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-[12px] font-medium uppercase tracking-wide text-slate-500">
            <ShieldCheck size={14} />
            <span>Playbook · {review.playbookName || review.playbook_name}</span>
          </div>
          <p className="mt-1 text-[12px] text-slate-500">
            Pass {summary.passCount ?? summary.pass_count ?? 0} · Fallback{" "}
            {summary.fallbackCount ?? summary.fallback_count ?? 0} · Missing{" "}
            {summary.missingCount ?? summary.missing_count ?? 0} · Off-playbook{" "}
            {summary.offPlaybookCount ?? summary.off_playbook_count ?? 0} ·
            Blockers {summary.blockerCount ?? summary.blocker_count ?? 0}
          </p>
        </div>
        {onDownload && (
          <button
            type="button"
            disabled={downloading}
            onClick={onDownload}
            className="inline-flex shrink-0 items-center gap-1 rounded-lg px-2 py-1 text-[12px] font-medium text-slate-700 hover:bg-white disabled:opacity-50"
          >
            <Download size={13} />
            DOCX
          </button>
        )}
      </div>
      <div className="space-y-2">
        {review.findings.map((finding) => (
          <div
            key={finding.key}
            className="rounded-xl border border-slate-200/70 bg-white px-3 py-2.5"
          >
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-[13px] font-semibold text-slate-800">
                {finding.label}
              </p>
              <span
                className={`rounded-md px-1.5 py-0.5 text-[10px] font-medium uppercase ring-1 ${
                  VERDICT_STYLES[finding.verdict] || VERDICT_STYLES.unclear
                }`}
              >
                {verdictLabel(finding.verdict)}
              </span>
            </div>
            {finding.extractedValue || finding.extracted_value ? (
              <p className="mt-1 text-[13px] text-slate-700">
                {finding.extractedValue || finding.extracted_value}
              </p>
            ) : null}
            <p className="mt-1 text-[12px] text-slate-500">{finding.reason}</p>
            {(finding.suggestedLanguage || finding.suggested_language) &&
              ["missing", "off_playbook", "fallback"].includes(
                finding.verdict
              ) && (
                <p className="mt-2 rounded-lg bg-slate-50 px-2.5 py-2 text-[12px] leading-5 text-slate-700">
                  <span className="font-medium text-slate-800">Suggested: </span>
                  {finding.suggestedLanguage || finding.suggested_language}
                </p>
              )}
          </div>
        ))}
      </div>
    </section>
  );
}

function RedlinePanel({ redline, onDownload, downloading }) {
  const hunks = redline?.hunks || [];
  if (!hunks.length && !redline?.unchanged) return null;

  return (
    <section className="rounded-2xl border border-slate-200/80 bg-[#FBFBFC] p-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-[12px] font-medium uppercase tracking-wide text-slate-500">
            <GitCompare size={14} />
            <span>
              {redline.mode === "playbook" ? "Playbook redline" : "Redline"}
            </span>
          </div>
          <p className="mt-1 truncate text-[12px] text-slate-500">
            {redline.leftFilename || redline.left_filename || "Current"} →{" "}
            {redline.rightFilename ||
              redline.right_filename ||
              "Proposed"}
          </p>
        </div>
        {onDownload && (
          <button
            type="button"
            disabled={downloading}
            onClick={onDownload}
            className="inline-flex shrink-0 items-center gap-1 rounded-lg px-2 py-1 text-[12px] font-medium text-slate-700 hover:bg-white disabled:opacity-50"
          >
            <Download size={13} />
            DOCX
          </button>
        )}
      </div>
      {redline.unchanged ? (
        <p className="text-[13px] text-slate-600">No differences.</p>
      ) : (
        <div className="space-y-3">
          {hunks.map((hunk, index) => (
            <div
              key={`${hunk.key || hunk.label}-${index}`}
              className="rounded-xl border border-slate-200/70 bg-white px-3 py-2.5"
            >
              <p className="mb-1.5 text-[12px] font-semibold text-slate-800">
                {hunk.label}
              </p>
              <div
                className="redline-html text-[13px] leading-6 text-slate-800 [&_del]:bg-rose-100 [&_del]:text-rose-800 [&_del]:no-underline [&_ins]:bg-sky-100 [&_ins]:font-semibold [&_ins]:text-sky-900 [&_ins]:no-underline"
                dangerouslySetInnerHTML={{
                  __html: hunk.html || hunk.markdown || "",
                }}
              />
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

export default function ContractArtifacts({
  message,
  matterId = null,
  conversationId = null,
}) {
  const [downloading, setDownloading] = useState(null);
  const [error, setError] = useState("");

  const clauseCards = message.clauseCards;
  const reviewTable = message.reviewTable;
  const playbookReview = message.playbookReview;
  const redline = message.redline;

  if (!clauseCards && !reviewTable && !playbookReview && !redline) {
    return null;
  }

  const documentId =
    clauseCards?.documentId ||
    clauseCards?.document_id ||
    playbookReview?.documentId ||
    playbookReview?.document_id ||
    redline?.leftDocumentId ||
    redline?.left_document_id ||
    null;

  async function runExport(kind, extra = {}) {
    setError("");
    setDownloading(kind);
    try {
      await downloadExport({
        kind,
        documentId: extra.documentId || documentId,
        againstDocumentId:
          extra.againstDocumentId ||
          redline?.rightDocumentId ||
          redline?.right_document_id ||
          null,
        matterId:
          matterId ||
          reviewTable?.matterId ||
          reviewTable?.matter_id ||
          null,
        conversationId:
          conversationId ||
          reviewTable?.conversationId ||
          reviewTable?.conversation_id ||
          null,
        playbookId:
          playbookReview?.playbookId ||
          playbookReview?.playbook_id ||
          null,
        title: extra.title,
        body: extra.body,
      });
    } catch (err) {
      setError(err?.message || "Download failed.");
    } finally {
      setDownloading(null);
    }
  }

  return (
    <div className="mt-4 space-y-3 border-t border-black/5 pt-3">
      {error && (
        <p className="rounded-lg bg-rose-50 px-3 py-2 text-[12px] text-rose-700">
          {error}
        </p>
      )}

      <ClauseCardsPanel
        cards={clauseCards?.cards}
        filename={clauseCards?.filename}
        downloading={downloading === "clauses"}
        onDownload={
          documentId ? () => runExport("clauses") : undefined
        }
      />

      <ReviewTablePanel
        table={reviewTable}
        downloading={downloading === "review_table"}
        onDownload={() => runExport("review_table")}
      />

      <PlaybookPanel
        review={playbookReview}
        downloading={downloading === "playbook"}
        onDownload={
          documentId ? () => runExport("playbook") : undefined
        }
      />

      <RedlinePanel
        redline={redline}
        downloading={downloading === "redline"}
        onDownload={
          documentId ? () => runExport("redline") : undefined
        }
      />
    </div>
  );
}
