import {ChangeDetectionStrategy, Component, computed, inject, signal} from '@angular/core';
import {CommonModule} from '@angular/common';
import {ResumeAnalyzerService} from './services/resume-analyzer.service';
import {AnalysisResponse} from './models/analysis-response.model';
import {marked} from 'marked';
import DOMPurify from 'dompurify';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    standalone: true,
    styleUrls: [],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [CommonModule]
})
export class AppComponent {
    private readonly resumeAnalyzerService = inject(ResumeAnalyzerService);

    // State management using signals
    selectedFile = signal<File | null>(null);
    isLoading = signal<boolean>(false);
    error = signal<string | null>(null);
    analysisResult = signal<AnalysisResponse | null>(null);
    dragOver = signal<boolean>(false);

    // testing
    currentAgentUsedService = signal<string | null>(null);
    currentAgentAttempt = signal<number | null>(null);


    fileName = computed(() => this.selectedFile()?.name ?? '');

    onDragOver(event: DragEvent): void {
        event.preventDefault();
        event.stopPropagation();
        this.dragOver.set(true);
    }

    onDragLeave(event: DragEvent): void {
        event.preventDefault();
        event.stopPropagation();
        this.dragOver.set(false);
    }

    onFileDrop(event: DragEvent): void {
        event.preventDefault();
        event.stopPropagation();
        this.dragOver.set(false);

        const files = event.dataTransfer?.files;
        if (files && files.length > 0) {
            this.handleFile(files[0]);
        }
    }

    onFileSelected(event: Event): void {
        const input = event.target as HTMLInputElement;
        if (input.files && input.files.length > 0) {
            this.handleFile(input.files[0]);
        }
    }

    private handleFile(file: File): void {
        this.error.set(null);
        if (file.type !== 'application/pdf') {
            this.error.set('Por favor, selecione um arquivo no formato PDF.');
            return;
        }
        if (file.size > 5 * 1024 * 1024) { // 5MB
            this.error.set('O arquivo é muito grande. O tamanho máximo é de 5MB.');
            return;
        }
        this.selectedFile.set(file);
    }

    clearFile(): void {
        this.selectedFile.set(null);
        this.error.set(null);
    }

    analyze(): void {
        const file = this.selectedFile();
        if (!file) return;

        this.isLoading.set(true);
        this.error.set(null);
        this.analysisResult.set(null);

        // Resetar infos da IA
        this.currentAgentUsedService.set(null);
        this.currentAgentAttempt.set(null);

        this.resumeAnalyzerService.analyzeResume(file).subscribe({
            next: (response) => {
                this.analysisResult.set(response);

                // Atualiza também as infos finais da IA
                this.currentAgentUsedService.set(response.agentResult.usedService);
                this.currentAgentAttempt.set(response.agentResult.geminiAttempt);
            },
            error: (err) => {
                console.error('Analysis failed', err);
                this.error.set('Ocorreu um erro ao analisar o currículo. Tente novamente mais tarde.');
                this.isLoading.set(false);
            },
            complete: () => {
                this.isLoading.set(false);
            }
        });
    }


    startOver(): void {
        this.selectedFile.set(null);
        this.isLoading.set(false);
        this.error.set(null);
        this.analysisResult.set(null);
    }

    formatMatchScore(score: number): string {
        return `${Math.round(score * 100)}%`;
    }

    formatText(text: string): string {
        if (!text) {
            return ''; // Retorna string vazia se o texto for nulo/undefined
        }

        // 1. Converte o texto Markdown (da API) para HTML
        const htmlSujo = marked.parse(text);

        // 2. Limpa o HTML para prevenir ataques XSS
        // É 'any' porque marked.parse() retorna string,
        // mas DOMPurify.sanitize() espera tipos mais complexos.
        return DOMPurify.sanitize(htmlSujo as any);
    }
}
