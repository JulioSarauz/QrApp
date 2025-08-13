import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-scan',
  templateUrl: './scan.page.html',
  styleUrls: ['./scan.page.scss'],
  standalone: false,
})
export class ScanPage implements OnInit {

  constructor(private router: Router) { }

  ngOnInit() {
  }
  goToGenerator() {
    this.router.navigateByUrl('/home');
  }

  goToScanner() {
    this.router.navigateByUrl('/scan');
  }
   goToMenu() {
    this.router.navigateByUrl('/menu');
  }
}
