"use client";

import { useState, useTransition, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import {
  Upload,
  Download,
  FileText,
  AlertCircle,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { previewCsvImport, executeCsvImport } from "@/server/actions/csv-import";
import type { CsvImportOptions } from "@/lib/validations/csv-import";
import type {
  CsvImportPreview,
  CsvValidationError,
  CsvImportResult,
} from "@/lib/utils/csv-products";

type Step = "upload" | "preview" | "result";

export function CsvImportForm() {
  const t = useTranslations("admin.csvImport");
  const locale = useLocale();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [step, setStep] = useState<Step>("upload");
  const [csvText, setCsvText] = useState<string>("");
  const [fileName, setFileName] = useState<string>("");
  const [mode, setMode] = useState<CsvImportOptions["mode"]>("CREATE_AND_UPDATE");
  const [skipErrors, setSkipErrors] = useState(false);
  const [preview, setPreview] = useState<CsvImportPreview | null>(null);
  const [result, setResult] = useState<CsvImportResult | null>(null);

  const handleFileSelect = useCallback(
    (file: File) => {
      if (!file.name.endsWith(".csv")) {
        toast.error(t("invalidFileType"));
        return;
      }
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result;
        if (typeof text === "string") {
          setCsvText(text);
          setFileName(file.name);
        }
      };
      reader.readAsText(file);
    },
    [t],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (file) handleFileSelect(file);
    },
    [handleFileSelect],
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFileSelect(file);
    },
    [handleFileSelect],
  );

  const handlePreview = () => {
    startTransition(async () => {
      try {
        const result = await previewCsvImport(csvText, mode);
        setPreview(result);
        setStep("preview");
      } catch (error) {
        toast.error(error instanceof Error ? error.message : t("previewError"));
      }
    });
  };

  const handleExecute = () => {
    startTransition(async () => {
      try {
        const importResult = await executeCsvImport(csvText, {
          mode,
          dryRun: false,
          skipErrors,
        });
        setResult(importResult);
        setStep("result");
        if (importResult.errors.length === 0) {
          toast.success(t("importSuccess"));
        }
      } catch (error) {
        toast.error(error instanceof Error ? error.message : t("importError"));
      }
    });
  };

  const handleReset = () => {
    setStep("upload");
    setCsvText("");
    setFileName("");
    setPreview(null);
    setResult(null);
  };

  return (
    <div className="space-y-6">
      {/* Step 1: Upload */}
      {step === "upload" && (
        <>
          {/* Download links */}
          <div className="flex gap-3">
            <Button variant="outline" size="sm" asChild>
              <a href="/api/admin/products/template" download>
                <Download className="mr-2 h-4 w-4" />
                {t("downloadTemplate")}
              </a>
            </Button>
          </div>

          {/* Drop zone */}
          <Card>
            <CardContent className="pt-6">
              <div
                onDrop={handleDrop}
                onDragOver={(e) => e.preventDefault()}
                className="border-muted-foreground/25 hover:border-muted-foreground/50 flex min-h-[200px] cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 transition-colors"
              >
                {fileName ? (
                  <div className="flex flex-col items-center gap-2">
                    <FileText className="text-muted-foreground h-10 w-10" />
                    <p className="font-medium">{fileName}</p>
                    <p className="text-muted-foreground text-sm">
                      {csvText.split("\n").length - 1} {t("rows")}
                    </p>
                    <Button variant="ghost" size="sm" onClick={handleReset}>
                      {t("changeFile")}
                    </Button>
                  </div>
                ) : (
                  <label className="flex cursor-pointer flex-col items-center gap-2">
                    <Upload className="text-muted-foreground h-10 w-10" />
                    <p className="text-muted-foreground text-sm">{t("dropZone")}</p>
                    <input
                      type="file"
                      accept=".csv"
                      className="hidden"
                      onChange={handleFileInput}
                    />
                  </label>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Options */}
          {csvText && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">{t("options")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>{t("mode")}</Label>
                  <Select
                    value={mode}
                    onValueChange={(v) => setMode(v as CsvImportOptions["mode"])}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CREATE_ONLY">{t("modeCreateOnly")}</SelectItem>
                      <SelectItem value="UPDATE_ONLY">{t("modeUpdateOnly")}</SelectItem>
                      <SelectItem value="CREATE_AND_UPDATE">
                        {t("modeCreateAndUpdate")}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center gap-2">
                  <Switch
                    id="skip-errors"
                    checked={skipErrors}
                    onCheckedChange={setSkipErrors}
                  />
                  <Label htmlFor="skip-errors">{t("skipErrors")}</Label>
                </div>

                <Button onClick={handlePreview} disabled={isPending}>
                  {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {t("preview")}
                </Button>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Step 2: Preview */}
      {step === "preview" && preview && (
        <>
          {/* Summary */}
          <div className="grid grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>{t("toCreate")}</CardDescription>
                <CardTitle className="text-2xl">{preview.summary.toCreate}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>{t("toUpdate")}</CardDescription>
                <CardTitle className="text-2xl">{preview.summary.toUpdate}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>{t("toSkip")}</CardDescription>
                <CardTitle className="text-2xl">{preview.summary.unchanged}</CardTitle>
              </CardHeader>
            </Card>
          </div>

          {/* Errors */}
          {preview.errors.length > 0 && (
            <Card className="border-destructive">
              <CardHeader>
                <CardTitle className="text-destructive flex items-center gap-2 text-base">
                  <AlertCircle className="h-4 w-4" />
                  {t("errors", { count: preview.errors.length })}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ErrorTable errors={preview.errors} t={t} />
              </CardContent>
            </Card>
          )}

          {/* Data preview */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                {t("dataPreview")} ({preview.rows.length} {t("rows")})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="max-h-[400px] overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("productName")}</TableHead>
                      <TableHead>{t("sku")}</TableHead>
                      <TableHead>{t("status")}</TableHead>
                      <TableHead className="text-right">{t("price")}</TableHead>
                      <TableHead className="text-right">{t("stock")}</TableHead>
                      <TableHead>{t("categoryCol")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {preview.rows.slice(0, 50).map((row, i) => (
                      <TableRow key={i}>
                        <TableCell className="font-medium">{row.name}</TableCell>
                        <TableCell>
                          <code className="text-xs">{row.variantSku || "\u2014"}</code>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">{row.status}</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          {(row.basePrice / 100).toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right">{row.variantStock}</TableCell>
                        <TableCell>{row.categorySlug || "\u2014"}</TableCell>
                      </TableRow>
                    ))}
                    {preview.rows.length > 50 && (
                      <TableRow>
                        <TableCell
                          colSpan={6}
                          className="text-muted-foreground text-center"
                        >
                          {t("andMore", {
                            count: preview.rows.length - 50,
                          })}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex gap-3">
            <Button variant="outline" onClick={handleReset}>
              {t("back")}
            </Button>
            <Button
              onClick={handleExecute}
              disabled={isPending || (preview.errors.length > 0 && !skipErrors)}
            >
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t("confirmImport")}
            </Button>
          </div>
        </>
      )}

      {/* Step 3: Result */}
      {step === "result" && result && (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                {result.errors.length === 0 ? (
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                ) : (
                  <AlertCircle className="text-destructive h-5 w-5" />
                )}
                {t("importComplete")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <p>{t("created", { count: result.created })}</p>
                <p>{t("updated", { count: result.updated })}</p>
                {result.skipped > 0 && <p>{t("skipped", { count: result.skipped })}</p>}
              </div>
            </CardContent>
          </Card>

          {result.errors.length > 0 && (
            <Card className="border-destructive">
              <CardHeader>
                <CardTitle className="text-destructive flex items-center gap-2 text-base">
                  <AlertCircle className="h-4 w-4" />
                  {t("errors", { count: result.errors.length })}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ErrorTable errors={result.errors} t={t} />
              </CardContent>
            </Card>
          )}

          <div className="flex gap-3">
            <Button variant="outline" onClick={handleReset}>
              {t("importAnother")}
            </Button>
            <Button onClick={() => router.push(`/${locale}/admin/products`)}>
              {t("viewProducts")}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}

function ErrorTable({
  errors,
  t,
}: {
  errors: CsvValidationError[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  t: any;
}) {
  return (
    <div className="max-h-[300px] overflow-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-20">{t("row")}</TableHead>
            <TableHead className="w-32">{t("column")}</TableHead>
            <TableHead>{t("error")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {errors.slice(0, 50).map((err, i) => (
            <TableRow key={i}>
              <TableCell>{err.row || "\u2014"}</TableCell>
              <TableCell>
                <code className="text-xs">{err.column || "\u2014"}</code>
              </TableCell>
              <TableCell className="text-destructive">{err.message}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
