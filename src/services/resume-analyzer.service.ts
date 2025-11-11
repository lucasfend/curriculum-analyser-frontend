import {inject, Injectable} from '@angular/core';
import {HttpClient, HttpErrorResponse} from '@angular/common/http';
import {catchError, Observable, throwError} from 'rxjs';
import {AnalysisResponse} from '../models/analysis-response.model';

@Injectable({
    providedIn: 'root'
})
export class ResumeAnalyzerService {
    private readonly http = inject(HttpClient);
    private readonly apiUrl = 'http://localhost:5036/api/rating/pdf';

    analyzeResume(file: File): Observable<AnalysisResponse> {
        const formData = new FormData();
        formData.append('pdfFile', file, file.name);

        return this.http.post<AnalysisResponse>(this.apiUrl, formData).pipe(
            catchError(this.handleError)
        );
    }

    private handleError(error: HttpErrorResponse) {
        let errorMessage = 'An unknown error occurred!';
        if (error.error instanceof ErrorEvent) {
            errorMessage = `Error: ${error.error.message}`;
        } else {
            errorMessage = `Server returned code: ${error.status}, error message is: ${error.message}`;
        }
        console.error(errorMessage);
        return throwError(() => new Error('Something bad happened; please try again later.'));
    }
}