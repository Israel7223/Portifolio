import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProjectService } from './services/project.service';
import { ProjectComponent } from './components/project.component';

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    ProjectComponent
  ],
  exports: [
    ProjectComponent
  ],
  providers: [
    ProjectService
  ]
})
export class ProjectModule { } 